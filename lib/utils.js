"use strict";

function readStream(s) {
  return new Promise((resolve, reject) => {
    const bufs = [];
    s.on("error", reject);
    s.on("data", d => bufs.push(d));
    s.on("end", () => resolve(Buffer.concat(bufs).toString("utf8")));
  });
}

module.exports = {
  readStream,
};
