#!/usr/bin/env node
import * as abnf from "../lib/abnf.js";
import * as util from "util";
import { Command } from "commander";
import { removeLoc } from "../lib/utils.js";

function print_ast(rules, opts) {
  for (const r of Object.values(rules.defs)) {
    if (!opts.location) {
      removeLoc(r);
    }
    console.log(util.inspect(r, {
      colors: process.stdout.isTTY,
      depth: Infinity,
      maxArrayLength: Infinity,
      maxStringLength: Infinity,
    }));
  }
}

const program = new Command();
program
  .argument("[abnfFile...]")
  .description("Output all of the rules derived from a given ABNF file")
  .option("-l,--location", "don't remove location information")
  .action(async(files, opts) => {
    if (files.length === 0) {
      files.push("-");
    }
    for (const f of files) {
      // eslint-disable-next-line no-useless-assignment
      let rules = null;
      try {
        if (f === "-") {
          rules = await abnf.parseStream(process.stdin, "stdin");
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
          process.exit(1);
        }
        throw er;
      }
      print_ast(rules, opts);
    }
  })
  .parseAsync()
  .catch(er => {
    console.error(er);
    process.exit(1);
  });
