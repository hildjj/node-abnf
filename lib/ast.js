"use strict";

const util = require("util");

// Abstract Syntax Tree for ABNF.
// Note: It is NOT the goal of this AST to preserve enough information
// to round-trip (at this time)

function slug(s) {
  return s.replace(/-/g, "_");
}

function str(s) {
  if (typeof s !== "string") {
    throw new Error(`Not a string: "${util.inspect(s)}"`);
  }
  return `"${s.replace(/[\\"\x00-\x19\x7f-\xff]/g, c => `\\${{
    "\r": "r",
    "\n": "n",
    '"': '"',
    "\t": "t",
    "\v": "v",
    "\\": "\\",
  }[c] || `x${c.charCodeAt(0).toString(16).padStart(2, "0")}`}`)}"`;
}

function peggyArray(a, joiner, needed) {
  if (Array.isArray(a)) {
    return a.map(b => peggyArray(b, joiner, needed)).join(joiner);
  }
  if (typeof a === "string") {
    return str(a);
  }
  return a.toPeggy(needed);
}

class Base {
  constructor(type, loc) {
    this.type = type;
    this.loc = loc;
  }

  toPeggy() {
    throw new Error(`Can't convert to peggy grammar [${this.type}]`);
  }
}

class Comment extends Base {
  constructor(str, loc) {
    super("comment", loc);
    this.str = str;
  }
}

class CaseInsensitiveString extends Base {
  constructor(str, base, loc) {
    super("caseInsensitveString", loc);
    this.str = str;
    this.base = base;
  }

  toPeggy() {
    if (this.str.match(/[a-z]/i)) {
      return str(this.str) + "i";
    }
    // Not worth the "i" modifier if there's no [a-zA-Z] characters.
    return str(this.str);
  }
}

class CaseSensitiveString extends Base {
  constructor(str, base, loc) {
    super("caseSensitveString", loc);
    this.str = str;
    this.base = base;
  }

  toPeggy() {
    return str(this.str);
  }
}

class Alternation extends Base {
  constructor(alts, loc) {
    super("alternation", loc);
    this.alts = alts;
  }

  add(alts) {
    this.alts = this.alts.concat(alts);
  }

  toPeggy(needed) {
    if (Array.isArray(this.alts) && (this.alts.length > 1)) {
      return "(" + peggyArray(this.alts, " / ", needed) + ")";
    }
    return peggyArray(this.alts, " / ", needed);
  }
}

class Repetition extends Base {
  constructor(rep, el, loc) {
    super("repetition", loc);
    this.rep = rep;
    this.el = el;
  }

  toPeggy(needed) {
    let many = null;
    if (this.rep.min === 0) {
      if (this.rep.max === 1) {
        many = "?";
      } else if (this.rep.max === null) {
        many = "*";
      }
    } else if (this.rep.min === 1) {
      if (this.rep.max === null) {
        many = "+";
      }
    }

    if (many) {
      if (Array.isArray(this.el)) {
        return "(" + peggyArray(this.el, " ", needed) + ")" + many;
      }
      return peggyArray(this.el, " ", needed) + many;
    }

    let ret = "";
    const num = (this.rep.max === null) ? this.rep.min : this.rep.max;
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
  constructor(min, max, loc) {
    super("repeat", loc);
    this.min = min;
    this.max = max;
  }
}

class Range extends Base {
  constructor(base, last, loc) {
    super("range", loc);
    this.base = base;
    this.last = last;
    this.first = null;
  }

  toPeggy() {
    return `[\\x${this.first.charCodeAt(0).toString(16).padStart(2, 0)}-\\x${this.last.charCodeAt(0).toString(16).padStart(2, 0)}]`;
  }

  setFirst(first) {
    this.first = first;
  }
}

class RuleRef extends Base {
  constructor(name, loc) {
    super("ruleref", loc);
    this.name = name;
  }

  toPeggy(needed) {
    needed.push(this.name);
    return slug(this.name);
  }
}

class Rule extends Base {
  constructor(name, def, loc) {
    super("rule", loc);
    this.name = name;
    this.def = def;
  }

  toPeggy(needed) {
    return `${slug(this.name)} = ${peggyArray(this.def, " ", needed)}\n\n`;
  }

  addAlternate(def, loc) {
    if (!(this.def instanceof Alternation)) {
      this.def = new Alternation([this.def], loc);
    }
    this.def.add(def);
    return this.def;
  }
}

class Group extends Base {
  constructor(alt, loc) {
    super("group", loc);
    this.alt = alt;
    if (!alt) {
      throw new TypeError(`Expected alt, got: "${alt}"`);
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

  toPeggy(opts = {}) {
    const needed = [opts.startRule || this.first];
    const done = new Set();
    let res = "";
    while (needed.length > 0) {
      const ro = needed.shift();
      const r = ro.toUpperCase();
      if (!done.has(r)) {
        done.add(r);
        const rule = this.defs[r.toUpperCase()];
        if (!rule) {
          if (opts.stubs) {
            res += `${ro} = . { throw new Error("Unknown rule '${ro}'") }\n`;
            continue;
          } else {
            throw new Error(`Unknown rule: "${r}"`);
          }
        }
        res += rule.toPeggy(needed);
      }
    }
    if (opts.unused) {
      for (const r of Object.values(this.defs)) {
        const ru = r.name.toUpperCase();
        if (!done.has(ru)) {
          done.add(ru);
          res += "// Unused rule\n";
          res += r.toPeggy(needed);
        }
      }
    }
    return res;
  }

  getLine(loc) {
    if (loc) {
      return loc.start.line;
    }
    return this.line;
  }

  addLine(bytes_left) {
    // The same newline can be visited multiple times by the parser
    // Have we seen this one before?
    if (Object.prototype.hasOwnProperty.call(this.line_ends, bytes_left)) {
      return;
    }
    this.line_ends[bytes_left] = this.line++;
  }

  addRule(name, def, loc) {
    const n = name.toUpperCase();
    if (!this.first) {
      this.first = n;
    }
    if (Object.prototype.hasOwnProperty.call(this.defs, n)) {
      throw new Error("Duplicate rule definition (line " + this.getLine(loc) + "): " + name);
    }
    const ret = new Rule(name, def, loc || this.last_def);
    this.defs[n] = ret;
    return ret;
  }

  addAlternate(name, def, loc) {
    const rule = this.defs[name];
    if (!rule) {
      throw new Error("Trying to add to a non-existant rule (line " + this.getLine(loc) + "): " + name);
    }
    return rule.addAlternate(def, loc);
  }

  addRef(name, loc) {
    const r = new RuleRef(name, loc || this.line);
    this.refs.push(r);
    return r;
  }

  findRefs(name) {
    name = name.toUpperCase();
    const res = [];
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
  CaseInsensitiveString,
  CaseSensitiveString,
  Comment,
  Group,
  Range,
  Repeat,
  Repetition,
  Rule,
  RuleRef,
  Rules,
};
