Parse ABNF grammars

Example:

    var abnf = require('abnf');
    abnf.Parse("myfile.abnf", function(er, rules) {
    	if (er) {
    		console.error(er);
    	} else {
    		// Do something with rules
    	}
    });

### .Parse(input, callback)
Parse the given input (string, filename, or readable stream), then call the
callback with an error (will be null on success) and a Rules object

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
