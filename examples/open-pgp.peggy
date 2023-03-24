signed
  = cleartext_header (hash_header)+ CRLF cleartext signature

cleartext_header
  = "-----BEGIN PGP SIGNED MESSAGE-----" CRLF

hash_header
  = "Hash" ": " hash_alg ("," hash_alg)* CRLF

CRLF
  = CR LF

cleartext
  = ("-"|..4| (UTF8_char_not_dash UTF8_char_not_cr*)? CRLF)*

signature
  = armor_header armor_keys CRLF signature_data armor_tail

hash_alg
  = token

CR
  = "\r"

LF
  = "\n"

UTF8_char_not_dash
  = UTF8_1_not_dash
  / UTF8_2
  / UTF8_3
  / UTF8_4

UTF8_char_not_cr
  = UTF8_1_not_cr
  / UTF8_2
  / UTF8_3
  / UTF8_4

armor_header
  = "-----" "BEGIN PGP SIGNATURE" "-----" CRLF

armor_keys
  = (token ": " ((VCHAR / WSP))* CRLF)*

signature_data
  = (((ALPHA / DIGIT / "=" / "+" / "/"))+ CRLF)+

armor_tail
  = "-----" "END PGP SIGNATURE" "-----" CRLF

token
  = ((ALPHA / DIGIT))+

UTF8_1_not_dash
  = [\x00-\x2c]
  / [\x2e-\x7f]

UTF8_2
  = [\xc2-\xdf] UTF8_tail

UTF8_3
  = "\xe0" [\xa0-\xbf] UTF8_tail
  / [\xe1-\xec] (UTF8_tail)|2|
  / "\xed" [\x80-\x9f] UTF8_tail
  / [\xee-\xef] (UTF8_tail)|2|

UTF8_4
  = "\xf0" [\x90-\xbf] (UTF8_tail)|2|
  / [\xf1-\xf3] (UTF8_tail)|3|
  / "\xf4" [\x80-\x8f] (UTF8_tail)|2|

UTF8_1_not_cr
  = [\x00-\x0c]
  / [\x0e-\x7f]

VCHAR
  = [\x21-\x7e]

WSP
  = SP
  / HTAB

ALPHA
  = [\x41-\x5a]
  / [\x61-\x7a]

DIGIT
  = [\x30-\x39]

UTF8_tail
  = [\x80-\xbf]

SP
  = " "

HTAB
  = "\t"

