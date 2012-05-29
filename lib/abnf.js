var ReParse = require('reparse').ReParse;
var util = require('util');
var stream = require('stream');
var path = require('path');
var fs = require('fs');

ReParse.prototype.string = function string(str) {
    var slen = str.length;
    var front = this.input.slice(0, slen);
    if (front === str) {
        this.input = this.input.slice(slen);
        return front;
    }
    return this.fail();
}

function functionize(f) {
    return function() {
        var args = arguments;
        var that = this;
        return function() {
            return f.apply(that, args);
        }
        return h;
    }
}

// Try to produce a value from method.  If it fails, restore the input
// to its previous state and returns null.
ReParse.prototype.might = function might(method) {
    var input = this.input;

    try {
        return this.produce(method);
    } catch (err) {
        if (err !== this.fail) {
            throw err;
        }
    }
    if (input !== undefined) {
        this.input = input;
    }
    return null;
};

ReParse.prototype.choicef = functionize(ReParse.prototype.choice);
ReParse.prototype.many1f = functionize(ReParse.prototype.many1);
ReParse.prototype.manyf = functionize(ReParse.prototype.many);
ReParse.prototype.matchf = functionize(ReParse.prototype.match);
ReParse.prototype.mightf = functionize(ReParse.prototype.might);
ReParse.prototype.seqf = functionize(ReParse.prototype.seq);
ReParse.prototype.stringf = functionize(ReParse.prototype.string);

// ALPHA          =  %x41-5A / %x61-7A   ; A-Z / a-z
function ALPHA() {
    return this.match(/^[\x41-\x5a\x61-\x7a]/);
}

// BIT            =  "0" / "1"
function BIT() {
    return this.choice(this.stringf('0'), this.stringf('1'));
}

// CHAR           =  %x01-7F
//                        ; any 7-bit US-ASCII character,
//                        ;  excluding NUL
function CHAR() {
    return this.match(/^[\x01-\x7f]/);
}

// CR             =  %x0D
//                     ; carriage return
function CR() {
    return this.string('\r');
}

// CRLF           =  CR LF
//                     ; Internet standard newline
function CRLF() {
    var ret = this.seq(CR, LF);
    this.rules.addLine(this.input.length);
    return "\r\n";
}

// CTL            =  %x00-1F / %x7F
//                     ; controls
function CTL() {
    return this.match(/^[\x00-\x1f\x7f]/);
}

// DIGIT          =  %x30-39
//                     ; 0-9
function DIGIT() {
    return this.match(/^[\x30-\x39]/);
}

// DQUOTE         =  %x22
//                     ; " (Double Quote)
function DQUOTE() {
    return this.string('"');
}

// HEXDIG         =  DIGIT / "A" / "B" / "C" / "D" / "E" / "F"
function HEXDIG() {
    return this.match(/^[\dA-F]/);
}

// HTAB           =  %x09
//                     ; horizontal tab
function HTAB() {
    return this.string('\t');
}

// LF             =  %x0A
//                     ; linefeed
function LF() {
    return this.string('\n');
}

// LWSP           =  *(WSP / CRLF WSP)
//                     ; linear white space (past newline)
function LWSP() {
    return this.choice(WSP, this.seq(CRLF, WSP));
}

// OCTET          =  %x00-FF
//                     ; 8 bits of data
function OCTET() {
    if (this.eof()) {
        return this.fail();
    }
    var o = this.input[0];
    this.input = this.input.slice(1);
    return o;
}

// SP             =  %x20
function SP() {
    return this.string(' ');
}

// VCHAR          =  %x21-7E
//                     ; visible (printing) characters
function VCHAR() {
    return this.match(/^[\x21-\x7e]/);
}

// WSP            =  SP / HTAB
//                     ; white space
function WSP() {
    return this.choice(this.stringf(' '), this.stringf('\t'));
}

function many_c_wsp() {
    return this.many(c_wsp);
}

function ws_seq() {
    return this.seq(many_c_wsp, c_nl);
}

// rulelist       =  1*( rule / (*c-wsp c-nl) )
function rulelist() {
    this.many1(this.choicef(rule, ws_seq));
    return this.rules;
}

// rule           =  rulename defined-as elements c-nl
//                     ; continues if next line starts
//                     ;  with white space
function rule() {
    var ret = this.seq(rulename, defined_as, elements, c_nl);

    var da = ret[2];
    if (da === "=") {
        return this.rules.addRule(ret[1], ret[3]);
    }
    if (da === "=/") {
        return this.rules.addAlternate(ret[1], ret[3]);
    }
    return this.fail();
}

// rulename       =  ALPHA *(ALPHA / DIGIT / "-")
function rulename() {
    var ret = this.seq(ALPHA, this.manyf(this.choicef(ALPHA, DIGIT, this.stringf('-'))));
    this.rules.last_def = this.rules.line;
    return [].concat(ret[1]).concat(ret[2]).join('');
}

// defined-as     =  *c-wsp ("=" / "=/") *c-wsp
//                     ; basic rules definition and
//                     ;  incremental alternatives
function defined_as() {
    var ret = this.seq(
        this.manyf(c_wsp),
        this.choicef(this.stringf('=/'), this.stringf('=')),
        this.manyf(c_wsp));
    return ret[2];
}

// elements       =  alternation *c-wsp
function elements() {
    var ret = this.seq(alternation, this.manyf(c_wsp));
    return ret[1];
}

// c-wsp          =  WSP / (c-nl WSP)
function c_wsp() {
    return this.choice(WSP, this.seqf(c_nl, WSP));
}

// c-nl           =  comment / CRLF
//                     ; comment or newline
function c_nl() {
    return this.choice(comment, CRLF);
}

function Comment(str) {
    this.str = str;
}

// comment        =  ";" *(WSP / VCHAR) CRLF
function comment() {
    var ret = this.seq(
        this.stringf(";"),
        this.manyf(this.choicef(WSP, VCHAR)),
        CRLF);
    return new Comment(ret[2]);
}

function Alternation(alts) {
    this.alts = alts;
}

Alternation.prototype.add = function(alts) {
    this.alts = this.alts.concat(alts);
};

// alternation    =  concatenation
//                *(*c-wsp "/" *c-wsp concatenation)
function alternation() {
    var ret = this.seq(
        concatenation,
        this.manyf(this.seqf(
            this.manyf(c_wsp),
            this.stringf('/'),
            this.manyf(c_wsp),
            concatenation)));
    if (ret[2].length === 0) {
        return ret[1];
    }

    var alts = ret[2].map(function(el){ return el[4] });
    return new Alternation([].concat(ret[1]).concat(alts));
}

// concatenation  =  repetition *(1*c-wsp repetition)
function concatenation() {
    var ret = this.seq(
        repetition,
        this.manyf(this.seqf(
            this.many1f(c_wsp),
            repetition)));
    if (ret[2].length === 0) {
        return ret[1];
    }
    var cats = ret[2].map(function(el){ return el[2] });
    return [].concat(ret[1]).concat(cats);
}

function Repetition(rep, el) {
    this.rep = rep;
    this.el = el;
}

// repetition     =  [repeat] ent
function repetition() {
    var ret = this.seq(this.mightf(repeat), element);
    if (ret[1]) {
        return new Repetition(ret[1], ret[2]);
    }
    return ret[2];
}

function Repeat(min, max) {
    this.min = min;
    this.max = max;
}

function repeat_star() {
    var ret = this.seq(
        this.manyf(DIGIT),
        this.stringf('*'),
        this.manyf(DIGIT));
    var min = 0;
    var max = null;
    if (ret[1].length > 0) {
        min = parseInt(ret[1].join(''));
    }
    if (ret[3].length > 0) {
        max = parseInt(ret[3].join(''));
    }
    return new Repeat(min, max);
}

function repeat_digits() {
    var ret = this.many1(DIGIT)
    var n = parseInt(ret.join(''));
    return new Repeat(n,n);
}

// repeat         =  1*DIGIT / (*DIGIT "*" *DIGIT)
function repeat() {
    return this.choice(
        repeat_star,
        repeat_digits);
}

function RuleRef(name, line) {
    this.name = name;
    this.line = line;
}

function ruleref() {
    var name = rulename.apply(this);
    return this.rules.addRef(name);
}

// element        =  rulename / group / option /
//                char-val / num-val / prose-val
function element() {
    return this.choice(
        ruleref,
        group,
        option,
        char_val,
        num_val,
        prose_val);
}

function Group(alt) {
    this.alt = alt;
}

// group          =  "(" *c-wsp alternation *c-wsp ")"
function group() {
    var ret = this.seq(
        this.stringf('('),
        this.manyf(c_wsp),
        alternation,
        this.manyf(c_wsp),
        this.stringf(')'));
    return new Group(ret[3]);
}

function Option(alt) {
    this.alt = alt;
}

// option         =  "[" *c-wsp alternation *c-wsp "]"
function option() {
    var ret = this.seq(
        this.stringf('['),
        this.manyf(c_wsp),
        alternation,
        this.manyf(c_wsp),
        this.stringf(']'));
    return new Option(ret[3]);
}

// char-val       =  DQUOTE *(%x20-21 / %x23-7E) DQUOTE
//                     ; quoted string of SP and VCHAR
//                     ;  without DQUOTE
function char_val() {
    var ret = this.seq(
        DQUOTE,
        this.manyf(this.matchf(/^[\x20-\x21\x23-\x7e]/)),
        DQUOTE);
    return ret[2].join('');
}

// num-val        =  "%" (bin-val / dec-val / hex-val)
function num_val() {
    var ret = this.seq(
        this.stringf('%'),
        this.choicef(bin_val, dec_val, hex_val));
    return ret[2];
}

function Range(base, last) {
    this.base = base;
    this.last = last
}

Range.prototype.setFirst = function(first) {
    this.first = first
}

function bitChar() {
    var ret = this.many1(BIT);
    return String.fromCharCode(parseInt(ret.join(''), 2));
}

function bit_string() {
    var ret = this.many1(this.seqf(this.stringf('.'), bitChar))
    return ret.map(function(el) { return el[2]; }).join('');
}

function bit_range() {
    var ret = this.seq(this.stringf('-'), bitChar);
    return new Range(2, ret[2]);
}

// bin-val        =  "b" 1*BIT
//                [ 1*("." 1*BIT) / ("-" 1*BIT) ]
//                     ; series of concatenated bit values
//                     ;  or single ONEOF range
function bin_val() {
    var ret = this.seq(
        this.stringf('b'),
        bitChar,
        this.mightf(
            this.choicef(
                bit_string,
                bit_range)));
    var r3 = ret[3];
    if (r3) {
        if (typeof(r3) === "string") {
            // series of concatenated bit values
            return ret[2] + r3;
        } else {
            // range
            r3.setFirst(ret[2]);
            return r3;
        }
    }
    return ret[2];
}

function decChar() {
    var ret = this.many1(DIGIT);
    return String.fromCharCode(parseInt(ret.join(''), 10));
}

function dec_string() {
    var ret = this.many1(this.seqf(this.stringf('.'), decChar))
    return ret.map(function(el) { return el[2]; }).join('');
}

function dec_range() {
    var ret = this.seq(this.stringf('-'), decChar);
    return new Range(10, ret[2]);
}

// dec-val        =  "d" 1*DIGIT
//                [ 1*("." 1*DIGIT) / ("-" 1*DIGIT) ]
function dec_val() {
    var ret = this.seq(
        this.stringf('d'),
        decChar,
        this.mightf(
            this.choicef(
                dec_string,
                dec_range)));
    var r3 = ret[3];
    if (r3) {
        if (typeof(r3) === "string") {
            // series of concatenated bit values
            return ret[2] + r3;
        } else {
            // range
            r3.setFirst(ret[2]);
            return r3;
        }
    }
    return ret[2];
}

function hexChar() {
    var ret = this.many1(HEXDIG);
    return String.fromCharCode(parseInt(ret.join(''), 16));
}

function hex_string() {
    var ret = this.many1(this.seqf(this.stringf('.'), hexChar))
    return ret.map(function(el) { return el[2]; }).join('');
}

function hex_range() {
    var ret = this.seq(this.stringf('-'), hexChar);
    return new Range(16, ret[2]);
}

// hex-val        =  "x" 1*HEXDIG
//                [ 1*("." 1*HEXDIG) / ("-" 1*HEXDIG) ]
function hex_val() {
    var ret = this.seq(
        this.stringf('x'),
        hexChar,
        this.mightf(
            this.choicef(
                hex_string,
                hex_range)));
    var r3 = ret[3];
    if (r3) {
        if (typeof(r3) === "string") {
            // series of concatenated bit values
            return ret[2] + r3;
        } else {
            // range
            r3.setFirst(ret[2]);
            return r3;
        }
    }
    return ret[2];
}

// prose-val      =  "<" *(%x20-3D / %x3F-7E) ">"
//                     ; bracketed string of SP and VCHAR
//                     ;  without angles
//                     ; prose description, to be used as
//                     ;  last resort
function prose_val() {
    return this.seq(
        this.stringf('<'),
        this.matchf(/^[\x20-\x3d\x3f-\x7e]*/),
        this.stringf('>'));
}

function Rule(name, def, line) {
    this.name = name;
    this.def = def;
    this.line = line;
}

Rule.prototype.addAlternate = function(def) {
    if (!(this.def instanceof Alternation)) {
        this.def = new Alternation([this.def]);
    }
    this.def.add(def);
    return this.def;
}

function Rules() {
    this.defs = {};
    this.refs = [];
    this.line = 1;
    this.last_def = -1;
    this.line_ends = {};
}

Rules.prototype.addLine = function(bytes_left) {
    // The same newline can be visited multiple times by the parser
    // Have we seen this one before?
    if (this.line_ends.hasOwnProperty(bytes_left)) {
        return;
    }
    this.line_ends[bytes_left] = this.line++;
};

Rules.prototype.addRule = function(name, def) {
    var n = name.toUpperCase();
    if (this.defs.hasOwnProperty(n)) {
        throw new Error("Duplicate rule definition (line " + this.line + "): " + name);
    }
    return this.defs[n] = new Rule(name, def, this.last_def);
};

Rules.prototype.addAlternate = function(name, def) {
    var rule = this.defs[name];
    if (!rule) {
        throw new Error("Trying to add to a non-existant rule (line " + this.line + "): " + name);
    }
    return rule.addAlternate(def);
};

Rules.prototype.addRef = function(name) {
    var r = new RuleRef(name, this.line);
    this.refs.push(r);
    return r;
};

Rules.prototype.parseString = function parseString(str, cb) {
    var m = str.match(/^\s+/);
    if (m) {
        var init_ws = m[0];
        str = str.replace(new RegExp("^" + init_ws, "gm"), "");
    }

    var r = new ReParse(str, false);
    r.rules = this;

    try {
        r.start(rulelist);
        if (cb) {
            cb(null, this);
        }
        return this;
    } catch (err) {
        cb(err, r);
        return null;
    }
}

Rules.prototype.parseStream = function parseStream(input, cb) {
    var bufs = [];
    var error = false;
    var that = this;

    input.on('data', function(chunk) {
        bufs.push(chunk);
    });
    input.on('error', function(er) {
        error = true;
        cb(er, that);
    });
    input.on('end', function() {
        if (error) {
            return;
        }
        var s = '';
        switch (bufs.length) {
            case 0:
                cb(null, r);
                return;
            case 1:
                s = bufs[0].toString();
                break;
            default:
                var len = bufs.reduce(function(prev,cur) {
                    return prev + cur.length;
                }, 0);
                var buf = new Buffer(len);
                bufs.reduce(function(prev,cur) {
                    cur.copy(buf, prev);
                    return prev + cur.length;
                }, 0);
                s = buf.toString();
                break;
        }
        that.parseString(s, cb);
    });
}

exports.Parse = function Parse(input, cb) {
    var r = new Rules();
    if (typeof(input) === "string") {
        // if it starts with whitespace, it's the abnf string
        // many of them do, because of the indentation
        if (/^\s+/.test(input)) {
            r.parseString(input, cb);
            return r;
        }
        path.exists(input, function(e) {
            if (e) {
                r.parseStream(fs.createReadStream(input), cb);
            } else {
                r.parseString(input, cb);
            }
        });
    } else if (input instanceof stream.Stream) {
        r.parseStream(input, cb);
    }
    return r;
};

