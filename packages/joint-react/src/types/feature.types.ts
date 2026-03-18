/**
 * A registered feature instance with lifecycle cleanup.
 * @internal
 */
export interface Feature<T = unknown> {
  readonly id: string;
  readonly instance: T;
  readonly clean?: () => void;
}
