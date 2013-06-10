
// Abstract Syntax Tree for ABNF.
// Note: It is NOT the goal of this AST to preserve enough information
// to round-trip (at this time)

exports.Comment = function Comment(str) {
    this.str = str;
};

exports.Alternation = function Alternation(alts) {
    this.alts = alts;
};

exports.Alternation.prototype.add = function(alts) {
    this.alts = this.alts.concat(alts);
};

exports.Repetition = function Repetition(rep, el) {
    this.rep = rep;
    this.el = el;
};

exports.Repeat = function Repeat(min, max) {
    this.min = min;
    this.max = max;
};

exports.Range = function Range(base, last) {
    this.base = base;
    this.last = last;
};

exports.Range.prototype.setFirst = function(first) {
    this.first = first;
};

exports.RuleRef = function RuleRef(name, line) {
    this.name = name;
    this.line = line;
};

exports.Rule = function Rule(name, def, line) {
    this.name = name;
    this.def = def;
    this.line = line;
};

exports.Rule.prototype.addAlternate = function(def) {
    if (!(this.def instanceof Alternation)) {
        this.def = new exports.Alternation([this.def]);
    }
    this.def.add(def);
    return this.def;
};

exports.Group = function Group(alt) {
    this.alt = alt;
};

exports.Rules = function Rules() {
    this.defs = {};
    this.refs = [];
    this.first = null;
    this.line = 1;
    this.last_def = -1;
    this.line_ends = {};
};

exports.Rules.prototype.addLine = function(bytes_left) {
    // The same newline can be visited multiple times by the parser
    // Have we seen this one before?
    if (this.line_ends.hasOwnProperty(bytes_left)) {
        return;
    }
    this.line_ends[bytes_left] = this.line++;
};

exports.Rules.prototype.addRule = function(name, def) {
    var n = name.toUpperCase();
    if (!this.first) {
        this.first = n;
    }
    if (this.defs.hasOwnProperty(n)) {
        throw new Error("Duplicate rule definition (line " + this.line + "): " + name);
    }
    var ret = this.defs[n] = new exports.Rule(name, def, this.last_def);
    return ret;
};

exports.Rules.prototype.addAlternate = function(name, def) {
    var rule = this.defs[name];
    if (!rule) {
        throw new Error("Trying to add to a non-existant rule (line " + this.line + "): " + name);
    }
    return rule.addAlternate(def);
};

exports.Rules.prototype.addRef = function(name) {
    var r = new exports.RuleRef(name, this.line);
    this.refs.push(r);
    return r;
};

exports.Rules.prototype.findRefs = function(name) {
    name = name.toUpperCase();
    var res = [];
    for (var i=0; i<this.refs.length; i++) {
        var ref = this.refs[i];
        if (ref.name.toUpperCase() === name) {
            res.push(ref);
        }
    }
    return res;
};
