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

/** @returns null if no errors, else an array of errors */
export function checkRefs(rules) {
  const errs = [];
  rules.refs.forEach(ref => {
    if (!Object.prototype.hasOwnProperty.call(
      rules.defs,
      ref.name.toUpperCase()
    )) {
      const loc = ref.loc;
      errs.push(`Reference to unknown rule "${ref.name}" at ${loc.source}:${loc.start.line}`);
    }
  });
  for (const name in rules.defs) {
    if ((rules.findRefs(name).length === 0) && (name !== rules.first)) {
      const loc = rules.defs[name].loc;
      errs.push(`Unreferenced rule "${name}" at ${loc.source}:${loc.start.line}`);
    }
  }
  if (!errs.length) {
    return null;
  } else {
    return errs;
  }
}
