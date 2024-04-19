abnf = $(wildcard *.abnf)
peggy = $(patsubst %.abnf,%.peggy,$(abnf))
js = $(patsubst %.peggy,%.js,$(peggy))

%.peggy: %.abnf
	../bin/abnf_gen.js $< -uo $@

.PRECIOUS: %.peggy
%.js: %.peggy
	npx peggy $< -o $@

.PHONY: all
all: $(js)

.PHONY: clean
clean:
	$(RM) $(js) $(peggy)

json.peggy: json.abnf
	../bin/abnf_gen.js $< -cuo $@
