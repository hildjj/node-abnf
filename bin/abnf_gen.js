#!/usr/bin/env node
import * as abnf from "../lib/abnf.js";
import { Command, Option } from "commander";
import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";
import { readStream } from "../lib/utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMBINED = "XXXXXCOMBINEDXXXXX";

function genFormat(rules, opts) {
  const out = rules.toFormat(opts);
  if (opts.output === "-") {
    console.log(out);
  } else {
    fs.writeFileSync(opts.output, out);
  }
}

function append(v, p = []) {
  p.push(v);
  return p;
}

const program = new Command();
program
  .argument("[abnfFile...]", "ABNF files to turn into grammars.")
  .description("Create a grammar from an ABNF file")
  .addOption(
    new Option("-f, --format <format>", "Output format")
      .choices(["peggy", "pest"])
      .default("peggy")
  )
  .option(
    "-s, --startRule <ruleName>",
    "Start rule for generated grammar.  Defaults to first rule in ABNF grammar.  Can be specified multiple times.",
    append
  )
  .option("--stubs", "Generate stubs for rules that do not exist, rather than failing.")
  .option(
    "-o, --output <file>",
    "Output grammar file name.  Derived from input file name if not specified.",
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
          p.ext = `.${opts.format}`;
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
      const utf16 = opts.format === "peggy";
      const rules = abnf.parseString(input, COMBINED, utf16);
      genFormat(rules, opts);
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
    console.error(er);
    process.exit(1);
  });
