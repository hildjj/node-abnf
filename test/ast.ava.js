import * as ast from "../lib/ast.js";
import test from "ava";

test("range escape", t => {
  const opts = {
    format: "peggy",
  };
  t.throws(() => ast.Range.escape(opts, 0x10000));
  t.is(ast.Range.escape(opts, 0x7c), "\\x7c");
  t.is(ast.Range.escape(opts, 0x100), "\\u0100");

  opts.format = "pest";
  t.notThrows(() => ast.Range.escape(opts, 0x10000));
  t.is(ast.Range.escape(opts, 0x7c), "'\\u{7c}'");
  t.is(ast.Range.escape(opts, 0x100), "'\\u{100}'");
});

test("bad base class types", t => {
  t.throws(() => new ast.Base());
  t.throws(() => new ast.Range("", 0, 1));
});

test("nested alternates", t => {
  const loc = {
    source: "source",
    start: {
      offset: 0,
      line: 1,
      column: 1,
    },
    end: {
      offset: 1,
      line: 1,
      column: 2,
    },
  };
  const alts = [
    new ast.Range(16, 0x7f, 0xd7ff, loc),
    new ast.Alternation([
      new ast.Range(16, 0xe000, 0xffff, loc),
    ], loc),
  ];
  const a = new ast.Alternation(alts, loc);
  t.truthy(a);
});

test("Deprecated toPeggy", t => {
  const r = new ast.Rules();
  const p = r.toPeggy();
  t.is(p, "");
});

test("bad format", t => {
  const opts = {
    format: "__invalid__",
  };
  const check = { message: /Unknown format/ };
  t.throws(() => new ast.Rules().toFormat(opts), check);
  t.throws(() => new ast.CaseInsensitiveString("foo", {}).toFormat(opts), check);
  t.throws(() => new ast.Concatenation([], {}).toFormat(opts), check);
  t.throws(() => new ast.Alternation([], {}).toFormat(opts), check);
  t.throws(() => new ast.Repeat(0, 1, {}).toFormat(opts), check);
  t.throws(() => new ast.HashRepeat(0, 1, {}).toFormat(opts), check);
  t.throws(() => new ast.Range(10, 1, 2, {}).toFormat(opts), check);
  t.throws(() => new ast.Rule("foo", [], {}).toFormat(opts), check);
  t.throws(() => ast.Range.escape(opts, 1));
});
