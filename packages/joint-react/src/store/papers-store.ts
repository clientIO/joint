import type { PaperStore } from './paper-store';

const ALIAS_PREFIX = 'alias:';
export class PaperStores extends Map<string, PaperStore> {
  // this is basically map but handling to resolve alias. and addAliasMethod
  private alternateId = new Map<string, string>();

  public set(id: string, paperStore: PaperStore, alias?: string) {
    super.set(id, paperStore);
    if (alias) {
      this.alternateId.set(`${ALIAS_PREFIX}${alias}`, id);
    }
    return this;
  }

  public resolveId(idOrAlias: string): string {
    return this.alternateId.get(`${ALIAS_PREFIX}${idOrAlias}`) ?? idOrAlias;
  }

  public get(idOrAlias: string): PaperStore | undefined {
    const id = this.resolveId(idOrAlias);
    return super.get(id);
  }
  public delete(idOrAlias: string): boolean {
    const id = this.resolveId(idOrAlias);
    for (const [alias, resolvedId] of this.alternateId.entries()) {
      if (resolvedId === id) {
        this.alternateId.delete(alias);
      }
    }
    return super.delete(id);
  }

  public has(idOrAlias: string): boolean {
    const id = this.resolveId(idOrAlias);
    return super.has(id);
  }
}
