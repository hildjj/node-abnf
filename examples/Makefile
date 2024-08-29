abnf = $(wildcard *.abnf)
peggy = $(patsubst %.abnf,%.peggy,$(abnf))
pest = $(patsubst %.abnf,%.pest,$(abnf))
js = $(patsubst %.peggy,%.js,$(peggy))

%.peggy: %.abnf
	../bin/abnf_gen.js $< -uo $@

%.pest: %.abnf
	../bin/abnf_gen.js -f pest $< -uo $@
	pest_debugger -g $@ < /dev/null

.PRECIOUS: %.peggy
%.js: %.peggy
	npx peggy $< -o $@

.PHONY: all
all: $(js) $(pest)

.PHONY: clean
clean:
	$(RM) $(js) $(peggy) $(pest)

json.peggy: json.abnf
	../bin/abnf_gen.js $< -cuo $@

json.pest: json.abnf
	../bin/abnf_gen.js $< -f pest -cuo $@
