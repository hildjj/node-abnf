rulelist
  = (rule / (c_wsp* c_nl))+

rule
  = rulename defined_as elements c_nl

c_wsp
  = WSP
  / (c_nl WSP)

c_nl
  = comment
  / CRLF

rulename
  = ALPHA (ALPHA / DIGIT / "-")*

defined_as
  = c_wsp* ("=" / "=/") c_wsp*

elements
  = alternation c_wsp*

WSP
  = SP
  / HTAB

comment
  = ";" (WSP / VCHAR)* CRLF

CRLF
  = CR LF

ALPHA
  = [\x41-\x5a]
  / [\x61-\x7a]

DIGIT
  = [\x30-\x39]

alternation
  = concatenation (c_wsp* "/" c_wsp* concatenation)*

SP
  = " "

HTAB
  = "\t"

VCHAR
  = [\x21-\x7e]

CR
  = "\r"

LF
  = "\n"

concatenation
  = repetition (c_wsp+ repetition)*

repetition
  = repeat? element

repeat
  = DIGIT+
  / (DIGIT* "*" DIGIT*)

element
  = rulename
  / group
  / option
  / char_val
  / num_val
  / prose_val

group
  = "(" c_wsp* alternation c_wsp* ")"

option
  = "[" c_wsp* alternation c_wsp* "]"

char_val
  = case_insensitive_string
  / case_sensitive_string

num_val
  = "%" (bin_val / dec_val / hex_val)

prose_val
  = "<" ([\x20-\x3d] / [\x3f-\x7e])* ">"

case_insensitive_string
  = "%i"i? quoted_string

case_sensitive_string
  = "%s"i quoted_string

bin_val
  = "b"i BIT+ (("." BIT+)+ / ("-" BIT+))?

dec_val
  = "d"i DIGIT+ (("." DIGIT+)+ / ("-" DIGIT+))?

hex_val
  = "x"i HEXDIG+ (("." HEXDIG+)+ / ("-" HEXDIG+))?

quoted_string
  = DQUOTE ([\x20-\x21] / [\x23-\x7e])* DQUOTE

BIT
  = "0"
  / "1"

HEXDIG
  = DIGIT
  / "A"i
  / "B"i
  / "C"i
  / "D"i
  / "E"i
  / "F"i

DQUOTE
  = "\""

