"use strict";

const test = require("ava");
const abnf = require("../lib/abnf.js");
const { removeLoc } = require("../lib/utils.js");

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
  rules = abnf.parseString("foo ::= %x20\n");
  t.snapshot(removeLoc(rules));
  rules = abnf.parseString("foo =/ %x20");
  t.snapshot(removeLoc(rules));
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
  t.throws(() => abnf.parseString("foo = (   )"));
  // Invalid repeat
  t.throws(() => abnf.parseString("foo = *0%60"));
  t.throws(() => abnf.parseString("foo = 0*0%60"));
  t.throws(() => abnf.parseString("foo = 1*0%60"));
  t.throws(() => abnf.parseString("foo = 3*2%60"));
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
