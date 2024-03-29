# Snapshot report for `test/parse.ava.js`

The actual snapshot is saved in `parse.ava.js.snap`.

Generated by [AVA](https://avajs.dev).

## newlines

> Snapshot 1

    Rules {
      defs: {
        FOO: Rule {
          def: CaseSensitiveString {
            base: 10,
            simple: true,
            str: ' ',
            type: 'caseSensitveString',
          },
          name: 'foo',
          simple: true,
          type: 'rule',
        },
      },
      first: 'FOO',
      refs: [],
      simple: true,
      type: 'rules',
    }

> Snapshot 2

    Rules {
      defs: {
        FOO: Rule {
          def: CaseSensitiveString {
            base: 10,
            simple: true,
            str: ' ',
            type: 'caseSensitveString',
          },
          name: 'foo',
          simple: true,
          type: 'rule',
        },
      },
      first: 'FOO',
      refs: [],
      simple: true,
      type: 'rules',
    }

> Snapshot 3

    Rules {
      defs: {
        FOO: Rule {
          def: CaseSensitiveString {
            base: 10,
            simple: true,
            str: ' ',
            type: 'caseSensitveString',
          },
          name: 'foo',
          simple: true,
          type: 'rule',
        },
      },
      first: 'FOO',
      refs: [],
      simple: true,
      type: 'rules',
    }

> Snapshot 4

    Rules {
      defs: {
        FOO: Rule {
          def: CaseSensitiveString {
            base: 10,
            simple: true,
            str: ' ',
            type: 'caseSensitveString',
          },
          name: 'foo',
          simple: true,
          type: 'rule',
        },
      },
      first: 'FOO',
      refs: [],
      simple: true,
      type: 'rules',
    }

## defined as

> Snapshot 1

    Rules {
      defs: {
        FOO: Rule {
          def: CaseSensitiveString {
            base: 10,
            simple: true,
            str: ' ',
            type: 'caseSensitveString',
          },
          name: 'foo',
          simple: true,
          type: 'rule',
        },
      },
      first: 'FOO',
      refs: [],
      simple: true,
      type: 'rules',
    }

> Snapshot 2

    Rules {
      defs: {
        FOO: Rule {
          def: CaseSensitiveString {
            base: 10,
            simple: true,
            str: ' ',
            type: 'caseSensitveString',
          },
          name: 'foo',
          simple: true,
          type: 'rule',
        },
      },
      first: 'FOO',
      refs: [],
      simple: true,
      type: 'rules',
    }

> Snapshot 3

    Rules {
      defs: {
        FOO: Rule {
          def: CaseSensitiveString {
            base: 10,
            simple: true,
            str: ' ',
            type: 'caseSensitveString',
          },
          name: 'foo',
          simple: true,
          type: 'rule',
        },
      },
      first: 'FOO',
      refs: [],
      simple: true,
      type: 'rules',
    }

## prose

> Snapshot 1

    Rules {
      defs: {
        FOO: Rule {
          def: Prose {
            simple: false,
            str: 'explanation',
            type: 'prose',
          },
          name: 'foo',
          simple: true,
          type: 'rule',
        },
      },
      first: 'FOO',
      refs: [],
      simple: true,
      type: 'rules',
    }

> Snapshot 2

    Rules {
      defs: {
        FOO: Rule {
          def: Prose {
            simple: false,
            str: `explanation␊
             on multiple␊
             lines`,
            type: 'prose',
          },
          name: 'foo',
          simple: true,
          type: 'rule',
        },
      },
      first: 'FOO',
      refs: [],
      simple: true,
      type: 'rules',
    }
