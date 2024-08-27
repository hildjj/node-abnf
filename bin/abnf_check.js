#!/usr/bin/env node
import * as abnf from "../lib/abnf.js";
import { Command } from "commander";

function check_refs(rules) {
  let ret = 0;
  rules.refs.forEach(ref => {
    if (!Object.prototype.hasOwnProperty.call(
      rules.defs,
      ref.name.toUpperCase()
    )) {
      const loc = ref.loc;
      console.log(`Reference to unknown rule "${ref.name}" at ${loc.source}:${loc.start.line}`);
      ret = 3;
    }
  });
  for (const name in rules.defs) {
    if ((rules.findRefs(name).length === 0) && (name !== rules.first)) {
      const loc = rules.defs[name].loc;
      console.log(`Unreferenced rule "${name}" at ${loc.source}:${loc.start.line}`);
      ret = 3;
    }
  }
  return ret;
}

let exitCode = 0;
const program = new Command();
program
  .argument("[abnfFile...]")
  .description("Check ABNF files for syntax, unused rules, and undefined rules")
  .action(async(files, opts) => {
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
      const cr = check_refs(rules, opts);
      if (cr) {
        exitCode = cr;
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
