abnf = $(wildcard *.abnf)
peggy = $(patsubst %.abnf,%.peggy,$(abnf))
js = $(patsubst %.peggy,%.js,$(peggy))

%.peggy: %.abnf
	../bin/abnf_gen $< -o $@

.PRECIOUS: %.peggy
%.js: %.peggy
	npx peggy $< -o $@

.PHONY: all
all: $(js)

.PHONY: clean
clean:
	$(RM) $(js) $(peggy)
