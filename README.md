# Parse ABNF grammars

For more information on the flavor of ABNF
([Augmented Backus-Naur Form](https://en.wikipedia.org/wiki/Augmented_Backus%E2%80%93Naur_form)) supported by this project,
see [RFC 5234](http://tools.ietf.org/html/rfc5234)
and [RFC 7405](https://www.rfc-editor.org/rfc/rfc7405).

## Installation:

    npm install -g abnf

## Example:

    import { parseFile } from "abnf";
    const rules = await parseFile("myfile.abnf");

## CLI

There are a few binaries included:

### abnf_check

Check the given ABNF file for correctness.

```txt
Usage: abnf_check [options] [abnfFile...]

Check ABNF files for syntax, unused rules, and undefined rules

Options:
  -h, --help  display help for command
```

### abnf_ast

Output the generated abstract syntax tree for the ABNF input.  This output is
mostly diagnostic in nature, not really meant to be parsed.

```txt
Usage: abnf_ast [options] [abnfFile...]

Output all of the rules derived from a given ABNF file

Options:
  -l,--location  don't remove location information
  -h, --help     display help for command
```

### abnf_gen

Generate a [Peggy](https://peggyjs.org/) grammar from the ABNF.  The idea
is that you could then annotate this grammar with actions in order to create
a useful parser.

```txt
Usage: abnf_gen [options] [abnfFile...]

Create a Peggy grammar from an ABNF file

Arguments:
  abnfFile                    ABNF files to turn into peggy grammars.

Options:
  -s, --startRule <ruleName>  Start rule for peggy grammar.  Defaults to first
                              rule in ABNF grammar.
  --stubs                     Generate stubs for rules that do not exist,
                              rather than failing.
  -o, --output <file>         Output peggy grammar file name.  Derived from
                              input file name if not specified. (default:
                              "stdin.peggy")
  -u, --unused                Output rules that are not reachable from the
                              start rule
  -c, --core                  Include core rules from RFC 5234, Appendix B.
  -h, --help                  display help for command
```

### abnf_test

Using an ABNF, test inputs to see if they match.  Returns the Peggy parse
tree, which will likely be somewhat confusing until you're familiar with Peggy.

```txt
Usage: abnf_test [options] [abnfFile...]

Send test inputs to an ABNF grammar

Arguments:
  abnfFile                    The ABNF to test.

Options:
  -o, --output                Output grammar source, if not testing.  Generated
                              from peggyFile name if needed.
  -s, --startRule <ruleName>  When testing, use this as the start rule.
  -t, --test <string>         String to check against grammar.
  -T, --testFile <file>       File contents to check against grammar.
  --trace                     Turn on peggy tracing
  -h, --help                  display help for command
```

## Suggested Workflow

```sh
$ cat << EOF > foo.abnf
f = "abc"
EOF
$ abnf_gen foo.abnf
$ cat foo.peggy
f
  = "abc"i
$ abnf_test foo.abnf -t abc
'abc'
$ abnf_test foo.peggy -t ab
Error: Expected "abc" but "a" found.
 --> command line:1:1
  |
1 | ab
  | ^
```

## API

### .parseFile(input)

Parse the file with the given name, returning a promise for a Rules object.

### .parseString(input, grammarSource = "unknown")

Parse the given string and return a Rules object.  The `grammarSource` is
the name of the file that the input came from.

### .parseStream(stream, grammarSource = "stdin")

Read the stream, parse it, and return a promise for a Rules object.  The
`grammarSource` is the name of the file that the input came from.

## Returned Rules object shape

### Rules.first

The name of the first rule in the input grammar.

### Rules.defs

A hash of Rule objects indexed by uppercase rulename.

### Rules.refs

An array of RuleRef objects.

### Rule.name

The name of the rule

### Rule.loc

The Peggy location in the input file where the rule name was defined

### Rule.def

The definition of the rule.  More information forthcoming.

### RuleRef.name

The name of the rule that was referenced

### RuleRef.loc

The Peggy location in the input file where the rule name was referenced.

---

[![Tests](https://github.com/hildjj/node-abnf/actions/workflows/node.js.yml/badge.svg)](https://github.com/hildjj/node-abnf/actions/workflows/node.js.yml)
[![codecov](https://codecov.io/gh/hildjj/node-abnf/branch/main/graph/badge.svg?token=waIK6vIrH6)](https://codecov.io/gh/hildjj/node-abnf)
