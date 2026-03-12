import { createState, type State } from '../utils/create-state';

export type ExternalContextId = string | number | symbol;
export type GraphExternalContextSnapshot = ReadonlyMap<ExternalContextId, number>;

export interface GraphExternalContextEntry {
  readonly value: unknown;
  readonly cleanup?: () => void;
}

export class GraphExternalContextStore {
  public readonly versionState: State<GraphExternalContextSnapshot>;
  public readonly entries = new Map<ExternalContextId, GraphExternalContextEntry>();

  constructor() {
    this.versionState = createState<GraphExternalContextSnapshot>({
      name: 'Jointjs/ExternalContexts',
      newState: () => new Map<ExternalContextId, number>(),
    });
  }

  public destroy = () => {
    for (const externalContext of this.entries.values()) {
      externalContext.cleanup?.();
    }
    this.entries.clear();
    this.versionState.clean();
  };

  public setExternalContext = (
    id: ExternalContextId,
    value: unknown,
    cleanup?: () => void
  ) => {
    this.entries.set(id, {
      value,
      cleanup,
    });
    this.bumpVersion(id);

    return () => {
      this.removeExternalContext(id);
    };
  };

  public removeExternalContext = (id: ExternalContextId) => {
    this.entries.get(id)?.cleanup?.();
    this.entries.delete(id);
    this.bumpVersion(id);
  };

  public getExternalContext = (id: ExternalContextId): GraphExternalContextEntry | null => {
    return this.entries.get(id) ?? null;
  };

  private bumpVersion = (id: ExternalContextId) => {
    this.versionState.setState((previous) => {
      const nextState = new Map(previous);
      const previousUpdateNumber = nextState.get(id) ?? 0;
      nextState.set(id, previousUpdateNumber + 1);
      return nextState;
    });
  };
}
