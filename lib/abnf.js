import * as ast from "./ast.js";
import * as fs from "fs";
import { parse } from "./abnfp.js";

export function parseString(str, grammarSource = "unknown", utf16 = true) {
  const text = str;
  try {
    return parse(text, {
      grammarSource,
      utf16,
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

export function parseStream(input, grammarSource = "stdin", utf16 = true) {
  return new Promise((resolve, reject) => {
    const bufs = [];

    input.on("data", chunk => {
      bufs.push(chunk);
    });
    input.on("error", reject);
    input.on("end", () => {
      // eslint-disable-next-line no-useless-assignment
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
        resolve(parseString(s, grammarSource, utf16));
      } catch (er) {
        reject(er);
      }
    });
  });
}

export function parseFile(input, utf16 = true) {
  return parseString(fs.readFileSync(input, "utf8"), input, utf16);
}
