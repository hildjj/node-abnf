#!/usr/bin/env node
import * as abnf from "../lib/abnf.js";
import { Command } from "commander";

let exitCode = 0;
const program = new Command();
program
  .argument("[abnfFile...]")
  .description("Check ABNF files for syntax, unused rules, and undefined rules")
  .action(async (files, opts) => {
    if (files.length === 0) {
      files.push("-");
    }
    for (const f of files) {
      // eslint-disable-next-line no-useless-assignment
      let rules = null;
      try {
        if (f === "-") {
          process.stdin.resume();
          rules = await abnf.parseStream(process.stdin);
        } else {
          rules = await abnf.parseFile(f);
        }
      } catch (er) {
        if (typeof er.format === "function") {
          console.error(er.format([
            {
              source: er.grammarSource,
              text: er.grammarText,
            },
          ]));
          process.exit(2);
        }
        throw er;
      }
      const errs = abnf.checkRefs(rules, opts);
      if (errs) {
        for (const err of errs) {
          console.error(err);
        }
        exitCode = 3;
      }
    }
  })
  .parseAsync()
  .then(() => {
    process.exit(exitCode);
  }, er => {
    console.error(er);
    process.exit(1);
  });
