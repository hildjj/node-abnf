"use strict";

const { removeLoc } = require("../lib/utils.js");
const abnf = require("../lib/abnf.js");
const fs = require("fs");
const path = require("path");
const stream = require("stream");
const test = require("ava");

const CORE = path.resolve(__dirname, "..", "examples", "core.abnf");

test("parseString error", t => {
  t.throws(() => abnf.parseString("foo =="), {
    message: /Expected " "/,
  });
});

test("parseFile", t => {
  const rules = abnf.parseFile(CORE);
  t.snapshot(removeLoc(rules));
});

test("parseStream", async t => {
  const s = fs.createReadStream(CORE);
  let rules = await abnf.parseStream(s, CORE);
  t.truthy((typeof rules === "object") && rules);

  let r = new stream.Readable({
    read() {
      this.push(null);
    },
  });
  rules = await abnf.parseStream(r, "empty");
  t.deepEqual(rules.defs, {});

  r = new stream.Readable({
    read() {
      this.push("foo =");
      this.push("%x20\n");
      this.push(null);
    },
  });
  rules = await abnf.parseStream(r, "empty");
  t.true("FOO" in rules.defs);

  r = new stream.Readable({
    read() {
      this.push("foo =");
      this.push(null);
    },
  });
  await t.throwsAsync(() => abnf.parseStream(r, "error"));
});
