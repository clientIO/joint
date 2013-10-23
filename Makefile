.PHONY: stest ctest

test: ctest stest

# client-side tests only
stest:
	./node_modules/.bin/mocha test/nodejs/tests.js
# server-side tests only
ctest:
	grunt qunit

all:
	grunt all
	grunt allinone
