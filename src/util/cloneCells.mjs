import { uniq, toArray, isEmpty } from './util.mjs';

// Clone `cells` returning an object that maps the original cell ID to the clone. The number
// of clones is exactly the same as the `cells.length`.
// This function simply clones all the `cells`. However, it also reconstructs
// all the `source/target` and `parent/embed` references within the `cells`.
// This is the main difference from the `cell.clone()` method. The
// `cell.clone()` method works on one single cell only.
// For example, for a graph: `A --- L ---> B`, `cloneCells([A, L, B])`
// returns `[A2, L2, B2]` resulting to a graph: `A2 --- L2 ---> B2`, i.e.
// the source and target of the link `L2` is changed to point to `A2` and `B2`.
export function cloneCells(cells) {

    cells = uniq(cells);

    // A map of the form [original cell ID] -> [clone] helping
    // us to reconstruct references for source/target and parent/embeds.
    // This is also the returned value.
    const cloneMap = toArray(cells).reduce(function(map, cell) {
        map[cell.id] = cell.clone();
        return map;
    }, {});

    toArray(cells).forEach(function(cell) {

        const clone = cloneMap[cell.id];
        // assert(clone exists)

        if (clone.isLink()) {
            const source = clone.source();
            const target = clone.target();
            if (source.id && cloneMap[source.id]) {
                // Source points to an element and the element is among the clones.
                // => Update the source of the cloned link.
                clone.prop('source/id', cloneMap[source.id].id);
            }
            if (target.id && cloneMap[target.id]) {
                // Target points to an element and the element is among the clones.
                // => Update the target of the cloned link.
                clone.prop('target/id', cloneMap[target.id].id);
            }
        }

        // Find the parent of the original cell
        const parent = cell.get('parent');
        if (parent && cloneMap[parent]) {
            clone.set('parent', cloneMap[parent].id);
        }

        // Find the embeds of the original cell
        const embeds = toArray(cell.get('embeds')).reduce(function(newEmbeds, embed) {
            // Embedded cells that are not being cloned can not be carried
            // over with other embedded cells.
            if (cloneMap[embed]) {
                newEmbeds.push(cloneMap[embed].id);
            }
            return newEmbeds;
        }, []);

        if (!isEmpty(embeds)) {
            clone.set('embeds', embeds);
        }
    });

    return cloneMap;
}

