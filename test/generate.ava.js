import * as abnf from "../lib/abnf.js";
import test from "ava";

function snapPeggy(t, str, opts) {
  try {
    const rules = abnf.parseString(str, "snapPeggy").toPeggy(opts);
    t.snapshot(rules, str);
  } catch (e) {
    if (e.format) {
      console.log(e.format([{ source: "snapPeggy", text: str }]));
    }
    throw e;
  }
}

test("newlines", t => {
  [
    "foo = %x20\n",
    "foo = %x20\r\n",
    "foo = %x20\r",
    "foo = %x20",
  ].map(snapPeggy.bind(null, t));
});

test("empty", t => {
  [
    "\n",
    "; comment\n",
    "   \n",
  ].map(snapPeggy.bind(null, t));
});

test("alternate equals", t => {
  [
    `foo = "a"

     foo =/ "b"`,
  ].map(snapPeggy.bind(null, t));
});

test("rule name", t => {
  [
    "fFfooo9-1231231 = %x60\n",
  ].map(snapPeggy.bind(null, t));
});

test("escapes", t => {
  [
    "start = %x22.5c.00.09.0a.0b.0d.19",
    'start = "()"',
  ].map(snapPeggy.bind(null, t));
});

test("prose", t => {
  [
    "start = <foo>",
    "start = <foo\nbar>",
  ].map(snapPeggy.bind(null, t));
});

test("concatenation", t => {
  [
    "start = %x60 %x61",
    "start = (%x60 %x61)",
  ].map(snapPeggy.bind(null, t));
});

test("alternates", t => {
  [
    "start = (%x60 / %x61) %x62",
  ].map(snapPeggy.bind(null, t));
});

test("repetition", t => {
  [
    "start = *%x62",
    "start = 1*%x62",
    "start = *1%x62",
    "start = *2%x62",
    "start = 1*2%x62",
    "start = 1*1%x62",
    "start = 1%x62",
    "start = 2*2%x62",
    "start = [%x62]",
    "start = [%x61 %x62]",
    "start = [%x61 / %x62]",
    "start = *(%x61 / %x62)",
  ].map(snapPeggy.bind(null, t));
});

test("range", t => {
  [
    "start = %x60-63",
    "start = %d96-99",
    "start = %b1100000-1100011",
  ].map(snapPeggy.bind(null, t));
});

test("rule reference", t => {
  [
    "start = one\none = %x60",
  ].map(snapPeggy.bind(null, t));
});

test("opts", t => {
  snapPeggy(t, "start = foo", { stubs: true });
  snapPeggy(t, "start = %x60\nfoo = %x51", { unused: true });
});

test("generate failures", t => {
  const rules = abnf.parseString("start = foo");
  t.throws(() => rules.toPeggy());
});

