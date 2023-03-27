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

### abnf_ast

Output the generated abstract syntax tree for the ABNF input.  This output
is mostly diagnostic in nature, not really meant to be parsed.

### abnf_gen

Generate a [Peggy](https://peggyjs.org/) grammar from the ABNF.  The idea
is that you could then annotate this grammar with actions in order to create
a useful parser.

### abnf_test

Using an ABNF, test inputs to see if they match.  Returns the Peggy parse
tree, which will likely be somewhat confusing until you're familiar with Peggy.

## Workflow

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
