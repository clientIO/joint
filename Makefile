
.PHONY: stest ctest

test: ctest stest cstest

# client-side tests only
stest:
	./node_modules/.bin/mocha test/nodejs/tests.js --reporter spec
# server-side tests only
ctest:
	grunt qunit
cstest:
	grunt jscs
all:
	grunt all
	grunt allinone
