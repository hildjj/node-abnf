const util = require("util");

// Abstract Syntax Tree for ABNF.
// Note: It is NOT the goal of this AST to preserve enough information
// to round-trip (at this time)

function slug(s) {
  return s.replace(/-/g, "_");
}

function str(s) {
  if (typeof s !== "string") {
    throw new Error(`Not a string: "${util.inspect(s)}"`)
  }
  return `"${s.replace(/["\t\v\r\n\x0c]/g, c => `\\${{
    "\r": "r",
    "\n": "n",
    '"': '"',
    "\t": "t",
    "\v": "v",
    "\x0c": "x0c",
  }[c]}`)}"`;
}

function peggyArray(a, joiner, needed) {
  if (Array.isArray(a)) {
    return a.map(b => ((typeof b === "string") ? str(b) : b.toPeggy(needed))).join(joiner)
  }
  if (typeof a === "string") {
    return str(a);
  }
  return a.toPeggy(needed);
}

class Base {
  constructor(type) {
    this.type = type;
  }

  toPeggy(needed) {
    return `[${this.type}]`;
  }
}

class Comment extends Base {
  constructor(str) {
    super("comment");
    this.str = str;
  }
}

class Alternation extends Base {
  constructor(alts) {
    super("alternation");
    this.alts = alts;
  }

  add(alts) {
    this.alts = this.alts.concat(alts);
  }

  toPeggy(needed) {
    return peggyArray(this.alts, " / ", needed);
  }
}

class Repetition extends Base {
  constructor(rep, el) {
    super("repetition");
    this.rep = rep;
    this.el = el;
  }

  toPeggy(needed) {
    let many = null;
    if (this.rep.min == 0) {
      if (this.rep.max === 1) {
        many = "?";
      } else if (this.rep.max === null) {
        many = "*"
      }
    } else if (this.rep.min === 1) {
      if (this.rep.max === null) {
        many = "+";
      }
    }

    if (many) {
      return peggyArray(this.el, "", needed) + many;
    }

    let ret = "";
    const num = (this.rep.max === null) ? this.rep.min : this.rep.max;
    console.log({num})
    for (let i = 0; i < num; i++) {
      if (i > 0) {
        ret += " ";
      }
      ret += peggyArray(this.el, "", needed);
      if (i >= this.rep.min) {
        ret += "?";
      }
    }
    if (this.rep.max === null) {
      ret += "*";
    }
    return ret;
  }
}

class Repeat extends Base {
  constructor(min, max) {
    super("repeat");
    this.min = min;
    this.max = max;
  }
}

class Range extends Base {
  constructor(base, last) {
    super("range");
    this.base = base;
    this.last = last;
    this.first = null;
  }

  toPeggy(needed) {
    return `[\\x${this.first.charCodeAt(0).toString(16).padStart(2, 0)}-\\x${this.last.charCodeAt(0).toString(16).padStart(2, 0)}]`
  }

  setFirst(first) {
    this.first = first;
  }
}

class RuleRef extends Base {
  constructor(name, line) {
    super("ruleref");
    this.name = name;
    this.line = line;
  }

  toPeggy(needed) {
    needed.push(this.name);
    return slug(this.name);
  }
}

class Rule extends Base {
  constructor(name, def, line) {
    super("rule");
    this.name = name;
    this.def = def;
    this.line = line;
  }

  toPeggy(needed) {
    return `${slug(this.name)} = ${peggyArray(this.def, " ", needed)}\n\n`
  }

  addAlternate(def) {
    if (!(this.def instanceof Alternation)) {
      this.def = new Alternation([this.def]);
    }
    this.def.add(def);
    return this.def;
  }
}

class Group extends Base {
  constructor(alt) {
    super("group");
    this.alt = alt;
    if (!alt) {
      throw new TypeError(`Expected alt, got: "${alt}"`)
    }
  }
  toPeggy(needed) {
    return `(${peggyArray(this.alt, " ", needed)})`;
  }
}

class Rules extends Base {
  constructor() {
    super("rules");
    this.defs = {};
    this.refs = [];
    this.first = null;
    this.line = 1;
    this.last_def = -1;
    this.line_ends = {};
  }

  toPeggy() {
    const needed = [this.first];
    const done = new Set();
    let res = "";
    while (needed.length > 0) {
      const r = needed.shift().toUpperCase();
      if (!done.has(r)) {
        done.add(r)
        const rule = this.defs[r.toUpperCase()]
        if (!rule) {
          throw new Error(`Unknown rule: "${r}"`)
        }
        res += rule.toPeggy(needed);
      }
    }
    return res;
  }

  addLine(bytes_left) {
    // The same newline can be visited multiple times by the parser
    // Have we seen this one before?
    if (this.line_ends.hasOwnProperty(bytes_left)) {
      return;
    }
    this.line_ends[bytes_left] = this.line++;
  }

  addRule(name, def) {
    const n = name.toUpperCase();
    if (!this.first) {
      this.first = n;
    }
    if (this.defs.hasOwnProperty(n)) {
      throw new Error("Duplicate rule definition (line " + this.line + "): " + name);
    }
    const ret = this.defs[n] = new Rule(name, def, this.last_def);
    return ret;
  }

  addAlternate(name, def) {
    const rule = this.defs[name];
    if (!rule) {
      throw new Error("Trying to add to a non-existant rule (line " + this.line + "): " + name);
    }
    return rule.addAlternate(def);
  }

  addRef(name) {
    const r = new RuleRef(name, this.line);
    this.refs.push(r);
    return r;
  }

  findRefs(name) {
    name = name.toUpperCase();
    var res = [];
    for (let i = 0; i < this.refs.length; i++) {
      const ref = this.refs[i];
      if (ref.name.toUpperCase() === name) {
        res.push(ref);
      }
    }
    return res;
  }
}

module.exports = {
  Alternation,
  Comment,
  Group,
  Range,
  Repeat,
  Repetition,
  Rule,
  RuleRef,
  Rules,
};
