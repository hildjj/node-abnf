export function readStream(s) {
  return new Promise((resolve, reject) => {
    const bufs = [];
    s.on("error", reject);
    s.on("data", d => bufs.push(d));
    s.on("end", () => resolve(Buffer.concat(bufs).toString("utf8")));
  });
}

export function visit(o, func) {
  if (typeof o !== "object" || !o) {
    return o;
  }
  if (Array.isArray(o)) {
    return o.map(i => visit(i, func));
  }
  func(o);
  for (const [k, v] of Object.entries(o)) {
    o[k] = visit(v, func);
  }
  return o;
}

export function removeLoc(o) {
  return visit(o, obj => delete obj.loc);
}
