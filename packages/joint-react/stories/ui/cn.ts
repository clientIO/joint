// ponytail: tiny class joiner instead of clsx + tailwind-merge. We author every
// class in this design system, so there are no conflicting utilities to merge —
// a falsy-filtering join is enough. Reach for tailwind-merge only if stories
// start composing conflicting classes from the outside.

type ClassValue = string | false | null | undefined;

/**
 * Joins truthy class names with a single space.
 * @param values - Class name fragments; falsy values are dropped.
 * @returns The combined class string.
 */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
