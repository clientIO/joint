/**
 * Helper function to update the store data more efficiently.
 * It compares the original map with the diff map and updates the original map in place.
 * If the diff map is empty, it returns the original map.
 * If the diff map is not empty, it creates a new map with the original map and the diff map.
 * @param original - The original map to update.
 * @param diff - The diff map to apply to the original map.
 * @param newDataContainKey - A function that checks if a key exists in the new map.
 * @returns - The updated map.
 * @description
 */
export function diffUpdate<K, V, M extends Map<K, V>>(
  original: M,
  diff: Map<K, V>,
  newDataContainKey: (key: K) => boolean
): M {
  let hasDelete = false;

  for (const [key] of original) {
    if (!newDataContainKey(key)) {
      original.delete(key);
      hasDelete = true;
    }
  }

  if (diff.size === 0 && !hasDelete) {
    return original;
  }

  const NewMapConstructor = original.constructor as new (entries?: Iterable<[K, V]>) => M;
  const newMap = new NewMapConstructor(original); // shallow copy to preserve type

  for (const [key, value] of diff) {
    newMap.set(key, value);
  }

  return newMap;
}
