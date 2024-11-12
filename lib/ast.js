import assert from "node:assert";

// Abstract Syntax Tree for ABNF.
// Note: It is NOT the goal of this AST to preserve enough information
// to round-trip (at this time)

const PEGGY_DELIMS = {
  sep: " ",
  alt: "/",
  before: "|",
  after: "|",
  count: "..",
  rangeBefore: "[",
  rangeAfter: "]",
  rangeSep: "-",
};
const PEST_DELIMS = {
  sep: " ~ ",
  alt: "|",
  before: "{",
  after: "}",
  count: ", ",
  rangeBefore: "",
  rangeAfter: "",
  rangeSep: "..",
};

/**
 * @typedef {object} FormatOptions
 * @prop {string} [format='peggy']
 * @prop {string|string[]} [startRule] Defaults to first
 * @prop {boolean} [stubs=false]
 * @prop {boolean} [unused=false]
 */

/**
 * @typedef {Required<FormatOptions>} RequiredFormatOptions
 * @prop {string} [FormatOptions.format='peggy']
 */

function slug(s) {
  return s.replace(/-/g, "_");
}

function str(s) {
  return `"${s.replace(/[\\"\x00-\x19\x7f-\xff]/g, c => `\\${{
    "\r": "r",
    "\n": "n",
    '"': '"',
    "\t": "t",
    "\v": "x0B",
    "\\": "\\",
  }[c] || `x${c.charCodeAt(0).toString(16).padStart(2, "0")}`}`)}"`;
}

function fromArray(opts, a, joiner, needed, parent) {
  if (Array.isArray(a)) {
    return a.map(b => fromArray(opts, b, joiner, needed)).join(joiner);
  }
  return a.toFormat(opts, needed, parent);
}

/**
 * Throw a bad format error.
 *
 * @param {RequiredFormatOptions} opts
 * @returns {never}
 */
function badFormat(opts) {
  throw new Error(`Unknown format: "${opts.format}"`);
}

function delims(opts) {
  switch (opts.format) {
    case "peggy":
      return PEGGY_DELIMS;
    case "pest":
      return PEST_DELIMS;
    default:
  }
  return badFormat(opts);
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
  /**
   * @abstract
   * @deprecated Use `toFormat({format: 'peggy'})
   */
  toPeggy(_opts) {
    throw new Error(`Deprecated conversion to peggy grammar [${this.type}]`);
  }

  /**
   *
   * @param {RequiredFormatOptions} opts
   */
  toFormat(_opts) {
    throw new Error(`Unimplmented formatter [${this.type}]`);
  }
  /* c8 ignore stop */
}

export class Prose extends Base {
  constructor(str, loc) {
    super("prose", loc, false);
    this.str = str;
  }

  toFormat(opts) {
    return `. { error(\`Can't convert prose description to ${opts.format} grammar: "${this.str}"\`) }`;
  }
}

export class CaseInsensitiveString extends Base {
  constructor(str, loc) {
    super("caseInsensitveString", loc);
    this.str = str;
  }

  toFormat(opts) {
    const s = str(this.str);
    if (this.str.match(/[a-z]/i)) {
      switch (opts.format) {
        case "peggy":
          return `${s}i`;
        case "pest":
          return `^${s}`;
        default:
          badFormat(opts);
      }
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

  toFormat(_opts) {
    return str(this.str);
  }
}

export class Concatenation extends Base {
  constructor(elements, loc) {
    super("concatenation", loc, false);
    this.elements = elements;
  }

  toFormat(opts, needed) {
    const { sep } = delims(opts);
    return fromArray(opts, this.elements, sep, needed);
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

  toFormat(opts, needed, parent) {
    const { alt } = delims(opts);
    if (parent && (parent.type === "rule")) {
      // Top level alts go on new lines
      return fromArray(opts, this.alts, `\n  ${alt} `, needed);
    }
    return fromArray(opts, this.alts, ` ${alt} `, needed);
  }
}

export class Repetition extends Base {
  constructor(rep, el, loc) {
    super("repetition", loc);
    this.rep = rep;
    this.el = el;
  }

  toFormat(opts, needed) {
    return this.rep.toFormat(opts, needed, this.el);
  }
}

export class Repeat extends Base {
  constructor(min, max, loc) {
    super("repeat", loc);
    this.min = min;
    this.max = max;
  }

  toFormat(opts, needed, el) {
    const { before, after, count } = delims(opts);

    let many = null;
    if (this.min === 0) {
      if (this.max === 1) {
        many = "?";
      } else if (this.max === null) {
        many = "*";
      }
    } else if (this.min === 1) {
      if (this.max === null) {
        many = "+";
      }
    }

    if (!many) {
      // Min is always an integer.  Max may be undefined or an int > min.
      if (this.min === this.max) {
        // 1*1 is a legal no-op
        many = (this.min > 1) ? `${before}${this.min}${after}` : "";
      } else {
        // It's idiomatic Peggy to not use 0 as the min of a range.
        many = `${before}${this.min || ""}${count}${this.max || ""}${after}`;
      }
    }

    let arr = fromArray(opts, el, " ", needed);
    if (!el.simple) {
      arr = "(" + arr + ")";
    }
    arr += many;
    return arr;
  }
}

export class HashRepeat extends Base {
  constructor(min, max, loc) {
    super("hash_repeat", loc);
    this.min = min;
    this.max = max;
  }

  toFormat(opts, needed, el) {
    if (opts.format !== "peggy") {
      // Need help from a pest-atarian.
      badFormat(opts);
    }

    // // range-set = 1#range-spec
    // range_set
    // = @ranges:(rs:(range_spec?)|1.., OWS "," OWS| {return rs.filter(r => r)}) &{
    //   return ranges.length > 0
    // }

    // Min is always an integer.  Max may be undefined or an int > min.

    let arr = fromArray(opts, el, " ", needed);
    assert(el.simple, "Non-simple elements should be impossible here");

    arr = `some:(${arr}?)|.., [ \\t]* "," [ \\t]*| {return some.filter(s => s)}`;
    if (this.min || this.max) {
      arr = `@count:(${arr}) &{ return `;
      if (this.min) {
        arr += `(count.length >= ${this.min})`;
        if (this.max) {
          arr += " && ";
        }
      }
      if (this.max) {
        arr += `(count.length <= ${this.max})`;
      }
      arr += " }";
    }

    return arr;
  }
}

export class Range extends Base {
  constructor(base, first, last, loc) {
    super("range", loc);
    this.base = base;
    this.first = first;
    this.last = last;
  }

  static create(base, first, last, loc, utf16 = true) {
    if (utf16 && (first <= 0xffff) && (last === 0x10ffff)) {
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

  static escape(opts, num) {
    if (opts.format === "peggy") {
      if (num <= 0xff) {
        return "\\x" + num.toString(16).padStart(2, 0);
      } else if (num <= 0xffff) {
        return "\\u" + num.toString(16).padStart(4, 0);
      } else {
        throw new Error(`0x${num.toString(16)} does not fit in UTF-16`);
      }
    }
    if (opts.format === "pest") {
      return `'\\u{${num.toString(16).padStart(2, 0)}}'`;
    }
    return badFormat(opts);
  }

  toFormat(opts) {
    const { rangeBefore, rangeAfter, rangeSep } = delims(opts);
    const first = Range.escape(opts, this.first);
    const last = Range.escape(opts, this.last);
    return `${rangeBefore}${first}${rangeSep}${last}${rangeAfter}`;
  }
}

export class RuleRef extends Base {
  constructor(name, loc) {
    super("ruleref", loc);
    this.name = name;
  }

  toFormat(opts, needed) {
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

  toFormat(opts, needed) {
    switch (opts.format) {
      case "peggy":
        return `${slug(this.name)}\n  = ${fromArray(opts, this.def, " ", needed, this)}\n\n`;
      case "pest":
        return `${slug(this.name)} = {\n  ${fromArray(opts, this.def, " ", needed, this)}\n}\n\n`;
      default:
        return badFormat(opts);
    }
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

  toFormat(opts, needed) {
    return `(${fromArray(opts, this.alt, " ", needed)})`;
  }
}

export class Rules extends Base {
  constructor() {
    super("rules", {}); // Location will be replaced later
    this.defs = {};
    this.refs = [];
    this.first = null;
  }

  toFormat(opts = {}) {
    opts = /** @type {RequiredFormatOptions} */ ({
      format: "peggy",
      startRule: this.first,
      stubs: false,
      unused: false,
      ...opts,
    });
    if (!["peggy", "pest"].includes(opts.format)) {
      badFormat(opts);
    }
    if (opts.startRule === null) {
      return "";
    }
    if (typeof opts.startRule === "string") {
      opts.startRule = [opts.startRule];
    }
    const needed = [...opts.startRule];
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
        res += rule.toFormat(opts, needed);
      }
    }
    if (opts.unused) {
      for (const r of Object.values(this.defs)) {
        const ru = r.name.toUpperCase();
        if (!done.has(ru)) {
          done.add(ru);
          res += "// Unused rule\n";
          res += r.toFormat(opts, needed);
        }
      }
    }
    return res;
  }

  /**
   * Convert to a peggy grammar.
   *
   * @param {*} opts
   * @returns
   * @deprecated Use `toFormat({format: 'peggy'})`
   */
  toPeggy(opts = {}) {
    opts.format = "peggy";
    return this.toFormat(opts);
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
