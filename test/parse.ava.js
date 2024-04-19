import * as abnf from "../lib/abnf.js";
import { parse } from "../lib/abnfp.js";
import { removeLoc } from "../lib/utils.js";
import test from "ava";

test("newlines", t => {
  let rules = abnf.parseString("foo = %x20\n");
  t.snapshot(removeLoc(rules));
  rules = abnf.parseString("foo = %x20\r\n");
  t.snapshot(removeLoc(rules));
  rules = abnf.parseString("foo = %x20\r");
  t.snapshot(removeLoc(rules));
  rules = abnf.parseString("foo = %x20");
  t.snapshot(removeLoc(rules));
});

test("defined as", t => {
  let rules = abnf.parseString("foo := %x20\n");
  t.snapshot(removeLoc(rules));
  rules = abnf.parseString("f ::= %x20");
  t.snapshot(removeLoc(rules));
  rules = abnf.parseString("foo = %x19 / %x20\nfoo =/ %x21\nfoo =/ %x22 / %x23\n");
  t.snapshot(removeLoc(rules));

  t.throws(() => abnf.parseString("foo =/ %x20"));
  t.throws(() => abnf.parseString("foo :::= %x20\n"));
});

test("failures", t => {
  // Bad rule names
  t.throws(() => abnf.parseString("8f = %x60\n"));
  t.throws(() => abnf.parseString("-f = %x60\n"));
  t.throws(() => abnf.parseString("foo_bar = %x60\n"));
  // Duplicate rule
  t.throws(() => abnf.parseString("foo = %x60\nfoo = %x61\n"));
  // Empty group
  t.throws(() => abnf.parseString("foo = (   )\n"));
  // Invalid repeat
  t.throws(() => abnf.parseString("foo = *0%60\n"));
  t.throws(() => abnf.parseString("foo = 0*0%60\n"));
  t.throws(() => abnf.parseString("foo = 1*0%60\n"));
  t.throws(() => abnf.parseString("foo = 3*2%60\n"));
  t.throws(() => abnf.parseString("; \x80\nfoo = %x20"));
  t.throws(() => abnf.parseString(";\x80\nfoo = %x20"));
  t.throws(() => abnf.parseString("foo = -"));
  t.throws(() => abnf.parseString("foo = ("));
  t.throws(() => abnf.parseString("foo = ( "));
  t.throws(() => abnf.parseString("foo = ( %x20"));
  t.throws(() => abnf.parseString("foo = ( %x20 "));
  t.throws(() => abnf.parseString("foo = ( %x20 /"));
  t.throws(() => abnf.parseString("foo = ["));
  t.throws(() => abnf.parseString("foo = [ %x20"));
  t.throws(() => abnf.parseString("foo = [ %x20 "));
  t.throws(() => abnf.parseString("foo = \"\x80"));
  t.throws(() => abnf.parseString("foo = %s\"\x80"));
  t.throws(() => abnf.parseString("foo = %s\" \x80"));
  t.throws(() => abnf.parseString("foo = %s"));
  t.throws(() => abnf.parseString("foo = <"));
  t.throws(() => abnf.parseString("foo = %b"));
  t.throws(() => abnf.parseString("foo = %b1\x80"));
  t.throws(() => abnf.parseString("foo = %b1.\x80"));
  t.throws(() => abnf.parseString("foo = %b1.1\x80"));
  t.throws(() => abnf.parseString("foo = %b1.1.\x80"));
  t.throws(() => abnf.parseString("foo = %b1-\x80"));
  t.throws(() => abnf.parseString("foo = %b1-10\x80"));
  t.throws(() => abnf.parseString("foo = %d"));
  t.throws(() => abnf.parseString("foo = %d1\x80"));
  t.throws(() => abnf.parseString("foo = %d1.\x80"));
  t.throws(() => abnf.parseString("foo = %d1.1\x80"));
  t.throws(() => abnf.parseString("foo = %d1.1.\x80"));
  t.throws(() => abnf.parseString("foo = %d1-\x80"));
  t.throws(() => abnf.parseString("foo = %d1-10\x80"));
  t.throws(() => abnf.parseString("foo = %x"));
  t.throws(() => abnf.parseString("foo = %x1\x80"));
  t.throws(() => abnf.parseString("foo = %x1.\x80"));
  t.throws(() => abnf.parseString("foo = %x1.1\x80"));
  t.throws(() => abnf.parseString("foo = %x1.1.\x80"));
  t.throws(() => abnf.parseString("foo = %x1-\x80"));
  t.throws(() => abnf.parseString("foo = %x1-10\x80"));
  t.throws(() => abnf.parseString("foo"));
});

test("prose", t => {
  let rules = abnf.parseString("foo = <explanation>\n");
  t.snapshot(removeLoc(rules));
  rules = abnf.parseString("foo = <explanation\n on multiple\n lines>\n");
  t.snapshot(removeLoc(rules));
});

test("findRefs", t => {
  const rules = abnf.parseString("foo = bar\nbar = %x61");
  const refs = rules.findRefs("bar");
  t.is(refs.length, 1);
});

test("special range", t => {
  const rules = abnf.parseString(`
; Range starts above 0xd800
high = %xE000-10ffff
low  = %x7c-10ffff
`);
  t.snapshot(removeLoc(rules));
});

test("case sensitive", t => {
  const rules = abnf.parseString(`
sensitive = %s"sensitive"
insensitive  = %i"insensitive"
decimal = %d97.98.99
decimalSep = %d97 %d98 %d99
binary = %b1100001.1100010.1100011
binarySep = %b1100001 %b1100010 %b1100011
`);
  t.snapshot(removeLoc(rules));
});

test("parser edges", t => {
  t.throws(() => parse("", {
    startRule: "___INVALID____",
  }));

  parse("foo = %x20\n", {
    startRule: "rulelist",
  });

  parse("foo = %x20\n", {
    peg$library: true,
  });

  const ret = parse("foo", {
    peg$library: true,
  });
  t.truthy(ret.peg$FAILED);
});
