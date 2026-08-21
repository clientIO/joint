// Changelog line format: `- <summary> (<short sha>)`.
//
// This replaces the default `@changesets/cli/changelog`, which renders the same
// information as a `<short sha>: ` prefix instead. `changeset.commit` is the
// full SHA of the commit that added the changeset file, resolved by Changesets
// from local git history - no GitHub token or API request is involved. It is
// `undefined` when the changeset file has not been committed yet (a local
// `changeset version` run), in which case the suffix is omitted.
//
// "Updated dependencies" blocks follow the same `(<short sha>)` convention. The
// default implementation emits one `- Updated dependencies [<short sha>]` line
// per changeset, which repeats the line when several changesets share a commit;
// this one emits a single line listing every contributing commit instead.
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
        // One line for all contributing commits, not one line per changeset.
        // Changesets that are not committed yet contribute no SHA, and a single
        // commit adding several changesets is only listed once.
        const shas = [
            ...new Set(
                changesets
                    .filter((changeset) => changeset.commit)
                    .map((changeset) => changeset.commit.slice(0, SHA_LENGTH))
            ),
        ];
        const suffix = shas.length > 0 ? ` [${shas.join(', ')}]` : '';
        return [
            `- Updated dependencies${suffix}`,
            ...dependenciesUpdated.map(
                (dependency) => `  - ${dependency.name}@${dependency.newVersion}`
            ),
        ].join('\n');
    },
};
