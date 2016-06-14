#!/bin/bash


packageJsonFile="$( cd "$( dirname "$0" )" && pwd )/../package.json";
re='version": ?"([^"]+)",?';
versionLine="$(grep -Po 'version": ?"([^"]+)",?' $packageJsonFile)";
if [[ $versionLine =~ $re ]]; then
	version="${BASH_REMATCH[1]}";
fi;

if [ -z "$version" ]; then
	echo "Failed to extract package version number.";
	exit 1;
fi;

# Check if this version has already been published.
if git rev-parse -q --verify "refs/tags/v$version" > /dev/null || [ "$(npm view jointjs@$version)" != "" ]; then
    echo "JointJS v$version has already been published.";
    exit 1;
fi;

nl=$'\n';
read -p "You are about to publish JointJS v$version${nl}Do you want to continue? (y/n) " ANSWER;

if [ "$ANSWER" = "y" ]; then
	# Continue with publishing.

	# Rebuild dist files, run all tests.
	grunt dist && grunt test;

	if [ $? -eq 0 ]; then
		echo "${nl}All tests passed. Continuing with publishing.";

		# Commit changes to dist directory.
		git add dist && git commit dist -m "Release v$version";

		# Create git tag.
		git tag -a "v$version" -m "Release v$version" && git push upstream && git push upstream v$version;

		if [ $? -eq 0 ]; then
			# Finally publish to npm.
			npm publish;
		fi;
	else
		echo "${nl}Aborted due to errors.";
		exit 1;
	fi;
else
	echo "${nl}Canceled.";
fi;

exit 0;
