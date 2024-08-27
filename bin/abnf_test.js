#!/usr/bin/env node
import * as abnf from "../lib/abnf.js";
import * as fs from "fs";
import * as path from "path";
import * as util from "util";
import { Command } from "commander";
import peggy from "peggy";
import { readStream } from "../lib/utils.js";

const program = new Command();
program
  .argument("[abnfFile...]", "The ABNF to test.")
  .description("Send test inputs to an ABNF grammar")
  .option(
    "-o, --output",
    "Output grammar source, if not testing.  Generated from peggyFile name if needed."
  )
  .option(
    "-s, --startRule <ruleName>",
    "When testing, use this as the start rule."
  )
  .option("-t, --test <string>", "String to check against grammar.")
  .option("-T, --testFile <file>", "File contents to check against grammar.")
  .option("--trace", "Turn on peggy tracing")
  .action(async(files, opts) => {
    if (files.length === 0) {
      files.push("-");
    }
    for (const f of files) {
      const s = (f === "-") ? process.stdin : fs.createReadStream(f);
      const abnfSource = await readStream(s);
      let testText = null;
      let testSource = null;
      // eslint-disable-next-line no-useless-assignment
      let text = null;
      try {
        const rules = await abnf.parseString(abnfSource, f);
        text = rules.toPeggy(opts);

        const abnfOpts = {
          grammarSource: f,
          trace: opts.trace,
        };
        if (opts.startRule) {
          abnfOpts.startRule = [opts.startRule];
        }
        const parser = peggy.generate(text, abnfOpts);

        if (typeof opts.test === "string") {
          testSource = "command line";
          testText = opts.test;
          const parseOpts = {
            grammarSource: testSource,
          };
          if (opts.startRule) {
            parseOpts.startRule = opts.startRule;
          }
          const results = parser.parse(opts.test, parseOpts);
          console.log(util.inspect(results, {
            depth: Infinity,
            colors: process.stdout.isTTY,
            maxArrayLength: Infinity,
            maxStringLength: Infinity,
          }));
        } else if (opts.testFile) {
          testSource = opts.testFile;
          testText = fs.readFileSync(opts.testFile, "utf8");
          console.log(util.inspect(parser.parse(testText, {
            grammarSource: testSource,
          }), {
            depth: Infinity,
            colors: process.stdout.isTTY,
            maxArrayLength: Infinity,
            maxStringLength: Infinity,
          }));
        } else {
          // Output.
          if (!opts.output) {
            const p = path.parse(f);
            delete p.base;
            p.ext = ".js";
            opts.output = path.format(p);
          }
          fs.writeFileSync(opts.output, parser);
        }
      } catch (er) {
        if (typeof er.format === "function") {
          er.message = er.format([
            {
              source: f,
              text: abnfSource,
            },
            {
              source: testSource,
              text: testText,
            },
          ]);
        }
        throw er;
      }
    }
  })
  .parseAsync()
  .catch(er => {
    console.error(er);
    process.exit(1);
  });
