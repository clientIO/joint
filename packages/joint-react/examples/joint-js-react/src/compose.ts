export function compose(...classNames: Array<string | undefined | null | false>): string {
  return classNames.filter(Boolean).join(' ')
}
