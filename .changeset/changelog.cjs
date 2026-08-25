const SHA_LENGTH = 8;

// NOTE: Returns `null` if the changeset has no commit yet (e.g. local)
const shortSha = (changeset) => {
    return ((changeset.commit) ? changeset.commit.slice(0, SHA_LENGTH) : null);
}

module.exports = {
    // Changelog line format:
    // - <first line of summary> (<short SHA>)
    //   <continuation lines of summary>
    //   ...
    getReleaseLine: async (changeset) => {
        const summaryLines = changeset.summary.split('\n');
        const trimmedLines = summaryLines.map((line) => line.trimEnd());
        const [firstLine, ...continuationLines] = trimmedLines;

        // Omit SHA suffix if the changeset has no commit (`null`)
        const sha = shortSha(changeset);
        const suffix = ((sha !== null) ? ` (${sha})` : '');

        // SHA suffix is added only to first line of summary
        let releaseLine = `- ${firstLine}${suffix}`;
        if (continuationLines.length > 0) {
            releaseLine += `\n${continuationLines.map((line) => `  ${line}`).join('\n')}`;
        }
        return releaseLine;
    },

    // Changelog dependency bump format:
    // - Updated dependencies [<short SHA>, ...]
    //   - <dependency@version>
    //   - <...>
    getDependencyReleaseLine: async (changesets, dependenciesUpdated) => {
        if (dependenciesUpdated.length === 0) return '';

        // Get one SHA per changeset
        const changesetShas = changesets.map((changeset) => shortSha(changeset));
        // Skip changesets with no commit (`null`)
        const filteredShas = changesetShas.filter((sha) => (sha !== null));
        // List each commit at most once
        const shas = [...new Set(filteredShas)];
        // Omit SHA suffix if there are no commits left after the above logic
        const suffix = ((shas.length) > 0 ? ` [${shas.join(', ')}]` : '');

        return [
            `- Updated dependencies${suffix}`,
            ...dependenciesUpdated.map(
                (dependency) => `  - ${dependency.name}@${dependency.newVersion}`
            ),
        ].join('\n');
    },
};
