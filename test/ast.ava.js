import * as ast from "../lib/ast.js";
import test from "ava";

test("range escape", t => {
  t.throws(() => ast.Range.escape(0x10000));
  t.is(ast.Range.escape(0x7c), "\\x7c");
  t.is(ast.Range.escape(0x100), "\\u0100");
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
