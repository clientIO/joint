
.PHONY: test stest ctest cstest all

# all tests
test:
	grunt test

# server-side tests only
stest:
	grunt test:server

# client-side tests only
ctest:
	grunt qunit:all

# code styling tests only
cstest:
	grunt jscs

all:
	grunt build:all
