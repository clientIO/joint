// Changelog line format: `- <summary> (<short sha>)`.
//
// This replaces the default `@changesets/cli/changelog`, which renders the same
// information as a `<short sha>: ` prefix instead. `changeset.commit` is the
// full SHA of the commit that added the changeset file, resolved by Changesets
// from local git history - no GitHub token or API request is involved. It is
// `undefined` when the changeset file has not been committed yet (a local
// `changeset version` run), in which case the suffix is omitted.
//
// `getDependencyReleaseLine` is a verbatim port of the default implementation,
// so "Updated dependencies" blocks are unchanged.
const SHA_LENGTH = 7;

module.exports = {
    getReleaseLine: async (changeset) => {
        const [firstLine, ...continuationLines] = changeset.summary
            .split('\n')
            .map((line) => line.trimEnd());
        const sha = changeset.commit
            ? ` (${changeset.commit.slice(0, SHA_LENGTH)})`
            : '';
        let releaseLine = `- ${firstLine}${sha}`;
        if (continuationLines.length > 0) {
            releaseLine += `\n${continuationLines.map((line) => `  ${line}`).join('\n')}`;
        }
        return releaseLine;
    },

    getDependencyReleaseLine: async (changesets, dependenciesUpdated) => {
        if (dependenciesUpdated.length === 0) return '';
        const changesetLinks = changesets.map(
            (changeset) =>
                `- Updated dependencies${changeset.commit ? ` [${changeset.commit.slice(0, SHA_LENGTH)}]` : ''}`
        );
        const updatedDependenciesList = dependenciesUpdated.map(
            (dependency) => `  - ${dependency.name}@${dependency.newVersion}`
        );
        return [...changesetLinks, ...updatedDependenciesList].join('\n');
    },
};
