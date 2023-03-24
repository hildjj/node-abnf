"use strict";

const ast = require("./ast.js");
const fs = require("fs");
const { parse } = require("./abnfp.js");

function parseString(str, grammarSource = "unknown") {
  try {
    return parse(str, {
      grammarSource,
    });
  } catch (er) {
    er.grammarSource = grammarSource;
    er.grammarText = str;
    throw er;
  }
}
exports.parseString = parseString;

function parseStream(input, grammarSource = "stdin") {
  return new Promise((resolve, reject) => {
    const bufs = [];

    input.on("data", chunk => {
      bufs.push(chunk);
    });
    input.on("error", er => {
      reject(er);
    });
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
exports.parseStream = parseStream;

exports.parseFile = function parseFile(input) {
  return parseString(fs.readFileSync(input, "utf8"), input);
};
