"use strict";

// Abstract Syntax Tree for ABNF.
// Note: It is NOT the goal of this AST to preserve enough information
// to round-trip (at this time)

function slug(s) {
  return s.replace(/-/g, "_");
}

function str(s) {
  return `"${s.replace(/[\\"\x00-\x19\x7f-\xff]/g, c => `\\${{
    "\r": "r",
    "\n": "n",
    '"': '"',
    "\t": "t",
    "\v": "v",
    "\\": "\\",
  }[c] || `x${c.charCodeAt(0).toString(16).padStart(2, "0")}`}`)}"`;
}

function peggyArray(a, joiner, needed, parent) {
  if (Array.isArray(a)) {
    return a.map(b => peggyArray(b, joiner, needed)).join(joiner);
  }
  // This shouldn't happen any more.  I think.
  // if (typeof a === "string") {
  //   return str(a);
  // }
  return a.toPeggy(needed, parent);
}

class Base {
  constructor(type, loc, simple = true) {
    this.type = type;
    this.loc = loc;
    this.simple = simple;
  }

  /* c8 ignore start */
  // Abstract
  toPeggy() {
    throw new Error(`Can't convert to peggy grammar [${this.type}]`);
  }
  /* c8 ignore stop */
}

class Comment extends Base {
  constructor(str, loc) {
    super("comment", loc);
    this.str = str;
  }
}

class Prose extends Base {
  constructor(str, loc) {
    super("prose", loc);
    this.str = str;
  }

  toPeggy() {
    throw new Error(`Can't convert prose description to peggy grammar: "${this.str}"`);
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

class Concatenation extends Base {
  constructor(elements, loc) {
    super("concatenation", loc, false);
    this.elements = elements;
  }

  toPeggy(needed) {
    return peggyArray(this.elements, " ", needed);
  }
}

class Alternation extends Base {
  constructor(alts, loc) {
    super("alternation", loc, false);
    this.alts = alts;
  }

  add(alts) {
    this.alts = this.alts.concat(alts);
  }

  toPeggy(needed, parent) {
    if (parent && (parent.type === "rule")) {
      return peggyArray(this.alts, "\n  / ", needed);
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

    if (typeof many !== "string") {
      if ((typeof this.rep.min === "number") && (this.rep.min === this.rep.max)) {
        if (this.rep.min > 1) {
          many = `|${this.rep.min}|`;
        } else {
          many = "";
        }
      } else {
        many = `|${this.rep.min || ""}..${this.rep.max || ""}|`;
      }
    }

    if (!this.el.simple) {
      return "(" + peggyArray(this.el, " ", needed) + ")" + many;
    }
    return peggyArray(this.el, " ", needed) + many;
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
  constructor(base, first, last, loc) {
    super("range", loc);
    this.base = base;
    this.first = first;
    this.last = last;
  }

  toPeggy() {
    const first = this.first.toString(16).padStart(2, 0);
    const last = this.last.toString(16).padStart(2, 0);
    return `[\\x${first}-\\x${last}]`;
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
    return `${slug(this.name)}\n  = ${peggyArray(this.def, " ", needed, this)}\n\n`;
  }

  addAlternate(def, loc) {
    if (!(this.def instanceof Alternation)) {
      this.def = new Alternation([this.def], this.def.loc);
    }
    this.def.add(def);
    this.def.loc.end = loc.end;
    return this;
  }
}

class Group extends Base {
  constructor(alt, loc) {
    super("group", loc);
    this.alt = alt;
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
  }

  toPeggy(opts = {}) {
    const first  = opts.startRule || this.first;
    if (!first) {
      return "";
    }
    const needed = [first];
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

  addRule(name, def, loc) {
    const n = name.toUpperCase();
    if (!this.first) {
      this.first = n;
    }
    if (Object.prototype.hasOwnProperty.call(this.defs, n)) {
      throw new Error("Duplicate rule definition (line " + loc.start.line + "): " + name);
    }
    const ret = new Rule(name, def, loc);
    this.defs[n] = ret;
    return ret;
  }

  addAlternate(name, def, loc) {
    const rule = this.defs[name.toUpperCase()];
    if (!rule) {
      return new Rule(name, def, loc);
    }
    return rule.addAlternate(def, loc);
  }

  addRef(name, loc) {
    const r = new RuleRef(name, loc);
    this.refs.push(r);
    return r;
  }

  findRefs(name) {
    const nameU = name.toUpperCase();
    return this.refs.filter(ref => ref.name.toUpperCase() === nameU);
  }
}

module.exports = {
  Alternation,
  CaseInsensitiveString,
  CaseSensitiveString,
  Comment,
  Concatenation,
  Group,
  Prose,
  Range,
  Repeat,
  Repetition,
  Rule,
  RuleRef,
  Rules,
};
