{{
const ast = require("./ast.js");
}}

{
const rules = new ast.Rules();
}

rulelist = (rule / empty)+ {
  rules.loc = location();
  return rules;
}

empty
  = WSP* comment
  / WSP* CRLF

// Allow starting whitespace before a rule
rule = WSP* name:rulename operator:defined_as children:elements c_nl {
  if (operator === "=/") {
    rules.addAlternate(name, children, location())
  } else {
    rules.addRule(name, children, location())
  }
}

rulename = $(ALPHA (ALPHA / DIGIT / "-")*)

defined_as = c_wsp* @("=" / "=/" / ":=") c_wsp*

elements = @alternation c_wsp*

comment = ";" txt:$(WSP / VCHAR)* CRLF {
  return new ast.Comment(txt, location());
}

alternation = head:concatenation tail:(c_wsp* "/" c_wsp* @concatenation)* {
  if (tail.length > 0) {
    return new ast.Alternation([head, ...tail], location());
  }
  return head;
}

concatenation = head:repetition tail:(c_wsp+ @repetition)* {
  if (tail.length > 0) {
    return new ast.Concatenation([head, ...tail]);
  }
  return head;
}

repetition = repeat:repeat? e:element {
  if (repeat) {
    return new ast.Repetition(repeat, e, location());
  }
  return e;
}

repeat
  = min:decnum? "*" max:decnum? {
    return new ast.Repeat(min || 0, max, location());
  }
  / n:decnum { return new ast.Repeat(n, n); }

element
  = name:rulename { return rules.addRef(name, location()) }
  / group
  / option
  / char_val
  / num_val
  / prose_val

group = "(" c_wsp* alt:alternation c_wsp* ")" {
  return new ast.Group(alt, location());
}

option = "[" c_wsp* alt:alternation c_wsp* "]" {
  return new ast.Repetition(new ast.Repeat(0, 1), alt, location());
}

char_val
  = "%i"i? DQUOTE txt:$([\x20-\x21] / [\x23-\x7e])* DQUOTE {
    return new ast.CaseInsensitiveString(txt, 0, location());
  }
  / "%s"i DQUOTE txt:$([\x20-\x21] / [\x23-\x7e])* DQUOTE {
    return new ast.CaseSensitiveString(txt, 0, location);
  }

num_val = "%" @(bin_val / dec_val / hex_val)

prose_val = "<" prose:$([\x20-\x3d] / [\x3f-\x7e] / CRLF)* ">" {
  return new ast.Prose(prose);
}

DQUOTE = "\""

bin_val
  = "b"i head:binnum tail:("." @binnum)+ {
    return new ast.CaseSensitiveString(
      [head, ...tail].map(b => String.fromCharCode(b)).join(""),
      2,
      location()
    );
  }
  / "b"i min:binnum "-" max:binnum {
    const r = new ast.Range(2, max, location());
    r.setFirst(min);
    return r;
  }
  / "b"i n:binnum {
    return new ast.CaseSensitiveString(String.fromCharCode(n), 2, location())
  }

dec_val
  = "d"i head:decnum tail:("." @decnum)+ {
    return new ast.CaseSensitiveString(
      [head, ...tail].map(d => String.fromCharCode(d)).join(""),
      10,
      location()
    );
  }
  / "d"i min:decnum "-" max:decnum {
    const r = new ast.Range(10, max, location());
    r.setFirst(min);
    return r;
  }
  / "d"i n:decnum {
    return new ast.CaseSensitiveString(String.fromCharCode(n), 10, location())
  }

hex_val
  = "x"i head:hexnum tail:("." @hexnum)+ {
    return new ast.CaseSensitiveString(
      [head, ...tail].map(x => String.fromCharCode(x)).join(""),
      16,
      location()
    );
  }
  / "x"i min:hexnum "-" max:hexnum {
    const r = new ast.Range(16, max, location());
    r.setFirst(min);
    return r;
  }
  / "x"i n:hexnum {
    return new ast.CaseSensitiveString(String.fromCharCode(n), 10, location())
  }

binnum = BIT+ { return parseInt(text(), 2) }
decnum = DIGIT+ { return parseInt(text(), 10) }
hexnum = HEXDIG+ { return parseInt(text(), 16) }

c_wsp
  = c_nl WSP
  / WSP

c_nl
  = CRLF
  / comment

BIT
  = "0"
  / "1"

HEXDIG
  = DIGIT
  / [A-F]i

ALPHA = [\x41-\x5a] / [\x61-\x7a]

DIGIT = [\x30-\x39]

WSP = SP / HTAB

SP = " "

HTAB = "\t"

VCHAR = [\x21-\x7e]

// CRLF = [\r\n]+

// Take any CR/LF sequence
CRLF
  = CR LF // Windows
  / LF    // Unix
  / CR    // Mac

CR = "\r"

LF = "\n"
