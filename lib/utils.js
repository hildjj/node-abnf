"use strict";

function readStream(s) {
  return new Promise((resolve, reject) => {
    const bufs = [];
    s.on("error", reject);
    s.on("data", d => bufs.push(d));
    s.on("end", () => resolve(Buffer.concat(bufs).toString("utf8")));
  });
}

function removeLoc(o) {
  if (typeof o !== "object" || !o) {
    return o;
  }
  if (Array.isArray(o)) {
    return o.map(i => removeLoc(i));
  }
  delete o.loc;
  for (const [k, v] of Object.entries(o)) {
    o[k] = removeLoc(v);
  }
  return o;
}

module.exports = {
  readStream,
  removeLoc,
};
