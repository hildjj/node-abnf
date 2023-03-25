message
  = (fields / obs_fields) (CRLF body)?

fields
  = (trace optional_field* / (resent_date / resent_from / resent_sender / resent_to / resent_cc / resent_bcc / resent_msg_id)+)* (orig_date / from / sender / reply_to / to / cc / bcc / message_id / in_reply_to / references / subject / comments / keywords / optional_field)*

obs_fields
  = (obs_return / obs_received / obs_orig_date / obs_from / obs_sender / obs_reply_to / obs_to / obs_cc / obs_bcc / obs_message_id / obs_in_reply_to / obs_references / obs_subject / obs_comments / obs_keywords / obs_resent_date / obs_resent_from / obs_resent_send / obs_resent_rply / obs_resent_to / obs_resent_cc / obs_resent_bcc / obs_resent_mid / obs_optional)*

CRLF
  = CR LF

body
  = ((text|..998| CRLF)* text|..998|)
  / obs_body

trace
  = return? received+

optional_field
  = field_name ":" unstructured CRLF

resent_date
  = "Resent-Date:"i date_time CRLF

resent_from
  = "Resent-From:"i mailbox_list CRLF

resent_sender
  = "Resent-Sender:"i mailbox CRLF

resent_to
  = "Resent-To:"i address_list CRLF

resent_cc
  = "Resent-Cc:"i address_list CRLF

resent_bcc
  = "Resent-Bcc:"i (address_list / CFWS)? CRLF

resent_msg_id
  = "Resent-Message-ID:"i msg_id CRLF

orig_date
  = "Date:"i date_time CRLF

from
  = "From:"i mailbox_list CRLF

sender
  = "Sender:"i mailbox CRLF

reply_to
  = "Reply-To:"i address_list CRLF

to
  = "To:"i address_list CRLF

cc
  = "Cc:"i address_list CRLF

bcc
  = "Bcc:"i (address_list / CFWS)? CRLF

message_id
  = "Message-ID:"i msg_id CRLF

in_reply_to
  = "In-Reply-To:"i msg_id+ CRLF

references
  = "References:"i msg_id+ CRLF

subject
  = "Subject:"i unstructured CRLF

comments
  = "Comments:"i unstructured CRLF

keywords
  = "Keywords:"i phrase ("," phrase)* CRLF

obs_return
  = "Return-Path"i WSP* ":" path CRLF

obs_received
  = "Received"i WSP* ":" (received_token+ / CFWS)? (";" date_time CRLF)?

obs_orig_date
  = "Date"i WSP* ":" date_time CRLF

obs_from
  = "From"i WSP* ":" mailbox_list CRLF

obs_sender
  = "Sender"i WSP* ":" mailbox CRLF

obs_reply_to
  = "Reply-To"i WSP* ":" address_list CRLF

obs_to
  = "To"i WSP* ":" address_list CRLF

obs_cc
  = "Cc"i WSP* ":" address_list CRLF

obs_bcc
  = "Bcc"i WSP* ":" (address_list / ((CFWS? ",")* CFWS?)) CRLF

obs_message_id
  = "Message-ID"i WSP* ":" msg_id CRLF

obs_in_reply_to
  = "In-Reply-To"i WSP* ":" (phrase / msg_id)* CRLF

obs_references
  = "References"i WSP* ":" (phrase / msg_id)* CRLF

obs_subject
  = "Subject"i WSP* ":" unstructured CRLF

obs_comments
  = "Comments"i WSP* ":" unstructured CRLF

obs_keywords
  = "Keywords"i WSP* ":" obs_phrase_list CRLF

obs_resent_date
  = "Resent-Date"i WSP* ":" date_time CRLF

obs_resent_from
  = "Resent-From"i WSP* ":" mailbox_list CRLF

obs_resent_send
  = "Resent-Sender"i WSP* ":" mailbox CRLF

obs_resent_rply
  = "Resent-Reply-To"i WSP* ":" address_list CRLF

obs_resent_to
  = "Resent-To"i WSP* ":" address_list CRLF

obs_resent_cc
  = "Resent-Cc"i WSP* ":" address_list CRLF

obs_resent_bcc
  = "Resent-Bcc"i WSP* ":" (address_list / ((CFWS? ",")* CFWS?)) CRLF

obs_resent_mid
  = "Resent-Message-ID"i WSP* ":" msg_id CRLF

obs_optional
  = field_name WSP* ":" unstructured CRLF

CR
  = "\r"

LF
  = "\n"

text
  = [\x01-\x09]
  / "\v"
  / "\x0c"
  / [\x0e-\x7f]

obs_body
  = ([\x00-\x7f])*

return
  = "Return-Path:"i path CRLF

received
  = "Received:"i (received_token+ / CFWS)? ";" date_time CRLF

field_name
  = ftext+

unstructured
  = ((FWS? VCHAR)* WSP*)
  / obs_unstruct

date_time
  = (day_of_week ",")? date time CFWS?

mailbox_list
  = (mailbox ("," mailbox)*)
  / obs_mbox_list

mailbox
  = name_addr
  / addr_spec

address_list
  = (address ("," address)*)
  / obs_addr_list

CFWS
  = ((FWS? comment)+ FWS?)
  / FWS

msg_id
  = CFWS? "<" id_left "@" id_right ">" CFWS?

phrase
  = word+
  / obs_phrase

WSP
  = SP
  / HTAB

path
  = angle_addr
  / (CFWS? "<" CFWS? ">" CFWS?)

received_token
  = word
  / angle_addr
  / addr_spec
  / domain

obs_phrase_list
  = (phrase / CFWS)? ("," (phrase / CFWS)?)*

ftext
  = [\x21-\x39]
  / [\x3b-\x7e]

FWS
  = ((WSP* CRLF)? WSP+)
  / obs_FWS

VCHAR
  = [\x21-\x7e]

obs_unstruct
  = ((CR* (obs_utext / FWS)+) / LF+)* CR*

day_of_week
  = (FWS? day_name)
  / obs_day_of_week

date
  = day month year

time
  = time_of_day zone

obs_mbox_list
  = (CFWS? ",")* mailbox ("," (mailbox / CFWS)?)*

name_addr
  = display_name? angle_addr

addr_spec
  = local_part "@" domain

address
  = mailbox
  / group

obs_addr_list
  = (CFWS? ",")* address ("," (address / CFWS)?)*

comment
  = "(" (FWS? ccontent)* FWS? ")"

id_left
  = dot_atom_text
  / obs_id_left

id_right
  = dot_atom_text
  / no_fold_literal
  / obs_id_right

word
  = atom
  / quoted_string

obs_phrase
  = word (word / "." / CFWS)*

SP
  = " "

HTAB
  = "\t"

angle_addr
  = CFWS? "<" addr_spec ">" CFWS?
  / obs_angle_addr

domain
  = dot_atom
  / domain_literal
  / obs_domain

obs_FWS
  = (CRLF? WSP)+

obs_utext
  = "\x00"
  / obs_NO_WS_CTL
  / VCHAR

day_name
  = "Mon"i
  / "Tue"i
  / "Wed"i
  / "Thu"i
  / "Fri"i
  / "Sat"i
  / "Sun"i

obs_day_of_week
  = CFWS? day_name CFWS?

day
  = (FWS? DIGIT|1..2| FWS)
  / obs_day

month
  = "Jan"i
  / "Feb"i
  / "Mar"i
  / "Apr"i
  / "May"i
  / "Jun"i
  / "Jul"i
  / "Aug"i
  / "Sep"i
  / "Oct"i
  / "Nov"i
  / "Dec"i

year
  = (FWS DIGIT|4..| FWS)
  / obs_year

time_of_day
  = hour ":" minute (":" second)?

zone
  = (FWS ("+" / "-") DIGIT|4|)
  / FWS? obs_zone

display_name
  = phrase

local_part
  = dot_atom
  / quoted_string
  / obs_local_part

group
  = display_name ":" group_list? ";" CFWS?

ccontent
  = ctext
  / quoted_pair

dot_atom_text
  = atext+ ("." atext+)*

obs_id_left
  = local_part

no_fold_literal
  = "[" dtext* "]"

obs_id_right
  = domain

atom
  = CFWS? atext+ CFWS?

quoted_string
  = CFWS? DQUOTE (((FWS? qcontent)+ FWS?) / FWS) DQUOTE CFWS?

obs_angle_addr
  = CFWS? "<" obs_route addr_spec ">" CFWS?

dot_atom
  = CFWS? dot_atom_text CFWS?

domain_literal
  = CFWS? "[" (FWS? dtext)* FWS? "]" CFWS?

obs_domain
  = atom ("." atom)*

obs_NO_WS_CTL
  = [\x01-\x08]
  / "\v"
  / "\x0c"
  / [\x0e-\x1f]
  / "\x7f"

DIGIT
  = [\x30-\x39]

obs_day
  = CFWS? DIGIT|1..2| CFWS?

obs_year
  = CFWS? DIGIT|2..| CFWS?

hour
  = DIGIT|2|
  / obs_hour

minute
  = DIGIT|2|
  / obs_minute

second
  = DIGIT|2|
  / obs_second

obs_zone
  = "UT"i
  / "GMT"i
  / "EST"i
  / "EDT"i
  / "CST"i
  / "CDT"i
  / "MST"i
  / "MDT"i
  / "PST"i
  / "PDT"i
  / [\x41-\x49]
  / [\x4b-\x5a]
  / [\x61-\x69]
  / [\x6b-\x7a]

obs_local_part
  = word ("." word)*

group_list
  = mailbox_list
  / CFWS
  / obs_group_list

ctext
  = [\x21-\x27]
  / [\x2a-\x5b]
  / [\x5d-\x7e]
  / obs_ctext

quoted_pair
  = ("\\" (VCHAR / WSP))
  / obs_qp

atext
  = ALPHA
  / DIGIT
  / "!"
  / "#"
  / "$"
  / "%"
  / "&"
  / "'"
  / "*"
  / "+"
  / "-"
  / "/"
  / "="
  / "?"
  / "^"
  / "_"
  / "`"
  / "{"
  / "|"
  / "}"
  / "~"

dtext
  = [\x21-\x5a]
  / [\x5e-\x7e]
  / obs_dtext

DQUOTE
  = "\""

qcontent
  = qtext
  / quoted_pair

obs_route
  = obs_domain_list ":"

obs_hour
  = CFWS? DIGIT|2| CFWS?

obs_minute
  = CFWS? DIGIT|2| CFWS?

obs_second
  = CFWS? DIGIT|2| CFWS?

obs_group_list
  = (CFWS? ",")+ CFWS?

obs_ctext
  = obs_NO_WS_CTL

obs_qp
  = "\\" ("\x00" / obs_NO_WS_CTL / LF / CR)

ALPHA
  = [\x41-\x5a]
  / [\x61-\x7a]

obs_dtext
  = obs_NO_WS_CTL
  / quoted_pair

qtext
  = "!"
  / [\x23-\x5b]
  / [\x5d-\x7e]
  / obs_qtext

obs_domain_list
  = (CFWS / ",")* "@" domain ("," CFWS? ("@" domain)?)*

obs_qtext
  = obs_NO_WS_CTL

