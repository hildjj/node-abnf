import * as ast from "./ast.js";
import * as fs from "fs";
import { parse } from "./abnfp.js";

export function parseString(str, grammarSource = "unknown") {
  const text = str;
  try {
    return parse(text, {
      grammarSource,
    });
  } catch (er) {
    er.grammarSource = grammarSource;
    er.grammarText = str;
    if (typeof er.format === "function") {
      er.message = er.format([{ source: grammarSource, text }]);
    }
    throw er;
  }
}

export function parseStream(input, grammarSource = "stdin") {
  return new Promise((resolve, reject) => {
    const bufs = [];

    input.on("data", chunk => {
      bufs.push(chunk);
    });
    input.on("error", reject);
    input.on("end", () => {
      let s = "";
      switch (bufs.length) {
        case 0:
          resolve(new ast.Rules());
          return;
        case 1:
          s = bufs[0].toString();
          break;
        default:
          s = Buffer.concat(bufs).toString();
          break;
      }
      try {
        resolve(parseString(s, grammarSource));
      } catch (er) {
        reject(er);
      }
    });
  });
}

export function parseFile(input) {
  return parseString(fs.readFileSync(input, "utf8"), input);
}
