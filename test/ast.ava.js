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

test("range utf16", t => {
  t.throws(() => ast.Range.create(16, 5, 4, {}));
  let r = ast.Range.create(16, 20, 20, {});
  t.is(r.type, "caseSensitveString");
  t.throws(() => ast.Range.create(16, 0xd801, 0xd805, {}));
  r = ast.Range.create(16, 0xe001, 0xffff, {});
  t.is(r.type, "range");
  t.is(r.first, 0xe001);
  t.is(r.last, 0xffff);
  r = ast.Range.create(16, 0x10004, 0x10401, {});
  t.is(
    r.toFormat({ format: "peggy" }),
    '"\\ud800" [\\udc04-\\udfff] / "\\ud801" [\\udc00\\udc01]'
  );
  r = ast.Range.create(16, 0x10004, 0x10c01, {});
  t.is(
    r.toFormat({ format: "peggy" }),
    '"\\ud800" [\\udc04-\\udfff] / [\\ud801\\ud802] [\\udc00-\\udfff] / "\\ud803" [\\udc00\\udc01]'
  );
  r = ast.Range.create(16, 0x10004, 0x10bff, {});
  t.is(
    r.toFormat({ format: "peggy" }),
    '"\\ud800" [\\udc04-\\udfff] / [\\ud801-\\ud803] [\\udc00-\\udfff]'
  );
  r = ast.Range.create(16, 0, 0x10ffff, {});
  t.is(
    r.toFormat({ format: "peggy" }),
    "[\\x00-\\ud7ff] / [\\ue000-\\uffff] / [\\ud800-\\udbff] [\\udc00-\\udfff]"
  );
  r = ast.Range.create(16, 0xee, 0xef, {});
  t.is(
    r.toFormat({ format: "pest" }),
    "'\\u{ee}'..'\\u{ef}'"
  );
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
