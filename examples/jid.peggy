jid
  = (localpart "@")? domainpart ("/" resourcepart)?

localpart
  = (nodepoint)+

domainpart
  = IP_literal
  / IPv4address
  / ifqdn

resourcepart
  = (resourcepoint)+

nodepoint
  = UTF8_char

IP_literal
  = "[" (IPv6address / IPvFuture) "]"

IPv4address
  = dec_octet "." dec_octet "." dec_octet "." dec_octet

ifqdn
  = (namepoint)+

resourcepoint
  = UTF8_char

UTF8_char
  = UTF8_1
  / UTF8_2
  / UTF8_3
  / UTF8_4

IPv6address
  = (h16 ":")|6| ls32
  / "::" (h16 ":")|5| ls32
  / h16? "::" (h16 ":")|4| ls32
  / ((h16 ":")? h16)? "::" (h16 ":")|3| ls32
  / ((h16 ":")|..2| h16)? "::" (h16 ":")|2| ls32
  / ((h16 ":")|..3| h16)? "::" h16 ":" ls32
  / ((h16 ":")|..4| h16)? "::" ls32
  / ((h16 ":")|..5| h16)? "::" h16
  / ((h16 ":")|..6| h16)? "::"

IPvFuture
  = "v"i HEXDIG+ "." (unreserved / sub_delims / ":")+

dec_octet
  = DIGIT
  / [\x31-\x39] DIGIT
  / "1" DIGIT|2|
  / "2" [\x30-\x34] DIGIT
  / "25" [\x30-\x35]

namepoint
  = UTF8_char

UTF8_1
  = [\x00-\x7f]

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

h16
  = HEXDIG|1..4|

ls32
  = (h16 ":" h16)
  / IPv4address

HEXDIG
  = DIGIT
  / "A"i
  / "B"i
  / "C"i
  / "D"i
  / "E"i
  / "F"i

unreserved
  = ALPHA
  / DIGIT
  / "-"
  / "."
  / "_"
  / "~"

sub_delims
  = "!"
  / "$"
  / "&"
  / "'"
  / "("
  / ")"
  / "*"
  / "+"
  / ","
  / ";"
  / "="

DIGIT
  = [\x30-\x39]

UTF8_tail
  = [\x80-\xbf]

ALPHA
  = [\x41-\x5a]
  / [\x61-\x7a]

