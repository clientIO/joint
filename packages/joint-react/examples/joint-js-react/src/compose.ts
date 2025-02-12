export function compose(...classNames: Array<string | undefined>): string {
  return classNames.filter(Boolean).join(' ')
}
