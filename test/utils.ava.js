"use strict";

const { readStream } = require("../lib/utils.js");
const stream = require("stream");
const test = require("ava");

test("readStream", async t => {
  const r = new stream.Readable({
    read() {
      this.push("foo = ");
      this.push("%x20\n");
      this.push(null);
    },
  });
  t.is(await readStream(r), "foo = %x20\n");
});
