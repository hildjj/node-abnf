import * as stream from "stream";
import { readStream } from "../lib/utils.js";
import test from "ava";

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
