#!/usr/bin/env node
import * as abnf from "../lib/abnf.js";
import { Command } from "commander";
import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";
import { readStream } from "../lib/utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMBINED = "XXXXXCOMBINEDXXXXX";

function gen_peggy(rules, opts) {
  const out = rules.toPeggy(opts);
  if (opts.output === "-") {
    console.log(out);
  } else {
    fs.writeFileSync(opts.output, out);
  }
}

const program = new Command();
program
  .argument("[abnfFile...]", "ABNF files to turn into peggy grammars.")
  .description("Create a Peggy grammar from an ABNF file")
  .option(
    "-s, --startRule <ruleName>",
    "Start rule for peggy grammar.  Defaults to first rule in ABNF grammar."
  )
  .option("--stubs", "Generate stubs for rules that do not exist, rather than failing.")
  .option(
    "-o, --output <file>",
    "Output peggy grammar file name.  Derived from input file name if not specified.",
    "stdin.peggy"
  )
  .option(
    "-u, --unused",
    "Output rules that are not reachable from the start rule"
  )
  .option("-c, --core", "Include core rules from RFC 5234, Appendix B.")
  .action(async(files, opts, cmd) => {
    if (files.length === 0) {
      files.push("-");
      if ((cmd.getOptionValueSource("output") === "default") && opts.core) {
        cmd.setOptionValueWithSource("output", opts.output, "forced");
      }
    }
    if (opts.core) {
      files.push(path.resolve(__dirname, "..", "examples", "core.abnf"));
    }

    let input = "";
    let lines = 0;
    const file_offsets = [];
    for (const f of files) {
      // eslint-disable-next-line no-useless-assignment
      let text = null;
      if (f === "-") {
        text = await readStream(process.stdin);
      } else {
        if (cmd.getOptionValueSource("output") === "default") {
          const p = path.parse(f);
          delete p.base;
          p.ext = ".peggy";
          cmd.setOptionValueWithSource("output", path.format(p), "first");
        }
        text = fs.readFileSync(f, "utf8");
      }
      const len = text.split("\r\n").length;
      file_offsets.push({
        name: f,
        start: lines,
        end: lines + len,
      });
      lines += len;
      input += text;
    }

    try {
      const rules = abnf.parseString(input, COMBINED);
      gen_peggy(rules, opts);
    } catch (er) {
      if (typeof er.format === "function") {
        const line = er.location.start.line;
        for (const { name, start, end } of file_offsets) {
          if ((line >= start) && (line <= end)) {
            const str = er.format([
              {
                source: COMBINED,
                text: input,
              },
            ]);
            er.message = str.replaceAll(COMBINED, name);
          }
        }
      }
      throw er;
    }
  })
  .parseAsync()
  .catch(er => {
    console.error(er.message);
    process.exit(1);
  });
