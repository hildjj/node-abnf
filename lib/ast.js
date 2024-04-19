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
  return a.toPeggy(needed, parent);
}

// Only exported for testing
export class Base {
  constructor(type, loc, simple = true) {
    if (typeof type !== "string") {
      throw new TypeError(`Invalid type: ${type}`);
    }
    if (!loc || (typeof loc !== "object")) {
      throw new TypeError(`Invalid location: ${loc} for ${type}`);
    }
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

export class Prose extends Base {
  constructor(str, loc) {
    super("prose", loc, false);
    this.str = str;
  }

  toPeggy() {
    return `. { error(\`Can't convert prose description to peggy grammar: "${this.str}"\`) }`;
  }
}

export class CaseInsensitiveString extends Base {
  constructor(str, loc) {
    super("caseInsensitveString", loc);
    this.str = str;
  }

  toPeggy() {
    const s = str(this.str);
    if (this.str.match(/[a-z]/i)) {
      return `${s}i`;
    }
    // Not worth the "i" modifier if there's no [a-zA-Z] characters.
    return s;
  }
}

export class CaseSensitiveString extends Base {
  constructor(str, base, loc) {
    super("caseSensitveString", loc);
    this.str = str;
    this.base = base;
  }

  toPeggy() {
    return str(this.str);
  }
}

export class Concatenation extends Base {
  constructor(elements, loc) {
    super("concatenation", loc, false);
    this.elements = elements;
  }

  toPeggy(needed) {
    return peggyArray(this.elements, " ", needed);
  }
}

export class Alternation extends Base {
  constructor(alts, loc) {
    super("alternation", loc, false);
    this.alts = alts.map(a => (a instanceof Alternation ? a.alts : a)).flat();
  }

  add(alt) {
    this.alts.push(alt);
  }

  toPeggy(needed, parent) {
    if (parent && (parent.type === "rule")) {
      // Top level alts go on new lines
      return peggyArray(this.alts, "\n  / ", needed);
    }
    return peggyArray(this.alts, " / ", needed);
  }
}

export class Repetition extends Base {
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

    if (!many) {
      // Min is always an integer.  Max may be undefined or an int > min.
      if (this.rep.min === this.rep.max) {
        // 1*1 is a legal no-op
        many = (this.rep.min > 1) ? `|${this.rep.min}|` : "";
      } else {
        // It's idiomatic Peggy to not use 0 as the min of a range.
        many = `|${this.rep.min || ""}..${this.rep.max || ""}|`;
      }
    }

    if (!this.el.simple) {
      return "(" + peggyArray(this.el, " ", needed) + ")" + many;
    }
    return peggyArray(this.el, " ", needed) + many;
  }
}

export class Repeat extends Base {
  constructor(min, max, loc) {
    super("repeat", loc);
    this.min = min;
    this.max = max;
  }
}

export class Range extends Base {
  constructor(base, first, last, loc) {
    super("range", loc);
    this.base = base;
    this.first = first;
    this.last = last;
  }

  static create(base, first, last, loc) {
    if ((first <= 0xffff) && (last === 0x10ffff)) {
      // Special case "all high Unicode" since it shows up a lot
      // This should be generalized.
      const alts = [];
      if (first < 0xd800) {
        alts.push(new Range(base, first, 0xd7ff, loc));
        alts.push(new Range(base, 0xe000, 0xffff, loc));
      } else {
        alts.push(new Range(base, first, 0xffff, loc));
      }
      alts.push(new Concatenation([
        new Range(base, 0xd800, 0xdbff, loc),
        new Range(base, 0xdc00, 0xdfff, loc),
      ], loc));

      return new Alternation(alts, loc);
    }
    return new Range(base, first, last, loc);
  }

  static escape(num) {
    if (num > 0xffff) {
      throw new Error(`0x${num.toString(16)} does not fit in UTF-16`);
    }

    return num <= 0xff
      ? "\\x" + num.toString(16).padStart(2, 0)
      : "\\u" + num.toString(16).padStart(4, 0);
  }

  toPeggy() {
    return `[${Range.escape(this.first)}-${Range.escape(this.last)}]`;
  }
}

export class RuleRef extends Base {
  constructor(name, loc) {
    super("ruleref", loc);
    this.name = name;
  }

  toPeggy(needed) {
    // Do not upcase here, so that unused rules will stay in the original case.
    needed.push(this.name);
    return slug(this.name);
  }
}

export class Rule extends Base {
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

export class Group extends Base {
  constructor(alt, loc) {
    super("group", loc);
    this.alt = alt;
  }

  toPeggy(needed) {
    return `(${peggyArray(this.alt, " ", needed)})`;
  }
}

export class Rules extends Base {
  constructor() {
    super("rules", {}); // Location will be replaced later
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
        const rule = this.defs[r];
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
      throw new Error(`Trying to add to a non-existant rule (line ${loc.start.line}): ${name}`);
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
