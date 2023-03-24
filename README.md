# Parse ABNF grammars

For more information on ABNF, See [RFC5234](http://tools.ietf.org/html/rfc5234).

## Installation:

    npm install abnf

## Example:

    const abnf = require('abnf');
    const rules = await abnf.parseFile("myfile.abnf");

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

Using an ABNF, test inputs to see if they match.  Returns the Peggy parse tree,
which you'll want to modify if you're going to actually use the generated grammar.

## Workflow

```sh
$ cat << EOF > foo.abnf
f = "abc"
EOF
$ abnf_gen foo.abnf
$ cat foo.peggy
f = "abc"i
$ abnf_test foo.peggy -t abc
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
Parse the file with the given name, returning a promise for a Rules object

### .parseString(input)
Parse the given string and return a Rules object

### .parseStream(stream)
Read the stream, parse it, and return a promise for a Rules object.

### Rules.first
The name of the first rule in the input grammar.

### Rules.defs
A hash of Rule objects indexed by uppercase rulename.

### Rules.refs
An array of RuleRef objects.

### Rule.name
The name of the rule

### Rule.line
The line in the input file where the rule name was defined

### Rule.def
The definition of the rule.  More information forthcoming.

### RuleRef.name
The name of the rule that was referenced

### RuleRef.line
The line in the input file where the rule name was referenced.
