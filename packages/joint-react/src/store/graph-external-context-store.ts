import { createState, type State } from '../utils/create-state';

export type GraphExternalContextId = string | number | symbol;
export type GraphExternalContextSnapshot = ReadonlyMap<GraphExternalContextId, number>;

export interface GraphExternalContextEntry {
  readonly value: unknown;
  readonly cleanup?: () => void;
}

export class GraphExternalContextStore {
  public readonly versionState: State<GraphExternalContextSnapshot>;
  public readonly entries = new Map<GraphExternalContextId, GraphExternalContextEntry>();

  constructor() {
    this.versionState = createState<GraphExternalContextSnapshot>({
      name: 'Jointjs/ExternalContexts',
      newState: () => new Map<GraphExternalContextId, number>(),
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
    id: GraphExternalContextId,
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

  public removeExternalContext = (id: GraphExternalContextId) => {
    this.entries.get(id)?.cleanup?.();
    this.entries.delete(id);
    this.bumpVersion(id);
  };

  public getExternalContext = (id: GraphExternalContextId): GraphExternalContextEntry | null => {
    return this.entries.get(id) ?? null;
  };

  private bumpVersion = (id: GraphExternalContextId) => {
    this.versionState.setState((previous) => {
      const nextState = new Map(previous);
      const previousUpdateNumber = nextState.get(id) ?? 0;
      nextState.set(id, previousUpdateNumber + 1);
      return nextState;
    });
  };
}
