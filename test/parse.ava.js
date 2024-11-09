import * as abnf from "../lib/abnf.js";
import { removeLoc, visit } from "../lib/utils.js";
import { parse } from "../lib/abnfp.js";
import test from "ava";
import { testPeggy } from "@peggyjs/coverage";

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
  rules = abnf.parseString(`\
foo = %x19 / %x20
foo =/ %x21
foo =/ %x22 / %x23
foo =/ (%x24 / %x25)
foo =/ (%x26 / %x27) / %x28
foo =/ (%x29 / %x2a) / (%x2b / %x2c)
foo =/ %x29 / %x2a / (%x2b / %x2c)
foo =/ %x29 / %x2a / %x2b / (%x2c)
foo =/ %x29 / %x2a / %x2b / %x2c
`);
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
  t.throws(() => abnf.parseString("foo = %x20 / /"));
  t.throws(() => abnf.parseString("foo = %x20 /"));
  t.throws(() => abnf.parseString("foo = %x20 / %x20 / "));
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
    startRule: ["___INVALID____"],
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

test("location", t => {
  // Try to get one of everything in here
  const rules = abnf.parseString(`
foo = %x20
foo =/ 2*"foo"
foo =/ *2"foot"
foo =/ (%s"bar" / %i"bare")
foo =/ "one" ["two"]
foo =/ %b1010 %d32 %x25
foo =/ %b1010.1011 %d32.33 %x25.26
foo =/ %b1010-1011 %d32-33 %x25-26
prose = <Some prose>
`);
  visit(rules, n => {
    if (n.type) {
      t.truthy(n.loc, n.type);
    }
  });
});

test("testPeggy", async t => {
  const starts = [
    {
      validInput: "foo = %x20\n",
      validResult(rules) {
        const res = removeLoc(rules);
        t.snapshot(res);
        return res;
      },
      peg$maxFailPos: 11,
    },
    {
      invalidInput: "",
    },
    {
      invalidInput: "foo",
      options: {
        peg$silentFails: -1,
      },
    },
    {
      validInput: " ",
      invalidInput: "a",
      options: {
        peg$startRuleFunction: "peg$parseSP",
      },
    },
    {
      validInput: "\t",
      invalidInput: "a",
      options: {
        peg$startRuleFunction: "peg$parseHTAB",
      },
    },
    {
      validInput: "!",
      invalidInput: " ",
      options: {
        peg$startRuleFunction: "peg$parseVCHAR",
      },
    },
  ];
  await testPeggy(new URL("../lib/abnfp.js", import.meta.url), starts);
});
