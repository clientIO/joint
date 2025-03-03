import { util, type dia } from '@joint/core';
import type { GraphElement, GraphLink } from './get-cell';
import { getElement, getLink } from './get-cell';

export class GraphElements<Data = undefined> extends Map<dia.Cell.ID, GraphElement<Data>> {
  constructor(items?: GraphElement<Data>[]) {
    super();
    if (!items) {
      return;
    }
    for (const item of items) {
      this.set(item.id, item);
    }
  }

  map<Element = GraphElement<Data>>(selector: (item: GraphElement<Data>) => Element): Element[] {
    return [...this.values()].map(selector);
  }

  filter(predicate: (item: GraphElement<Data>) => boolean): GraphElement<Data>[] {
    return [...this.values()].filter(predicate);
  }
  toJSON(): string {
    return JSON.stringify([...this.entries()]);
  }
}

export class GraphLinks extends Map<dia.Cell.ID, GraphLink> {
  constructor(items?: GraphLink[]) {
    super();
    if (items) {
      for (const item of items) {
        this.set(item.id, item);
      }
    }
  }
  map<Link = GraphLink>(selector: (item: GraphLink) => Link): Link[] {
    return [...this.values()].map(selector);
  }

  filter(predicate: (item: GraphLink) => boolean): GraphLink[] {
    return [...this.values()].filter(predicate);
  }

  toJSON(): string {
    return JSON.stringify([...this.entries()]);
  }
}

export class GraphData<Data = undefined> {
  elements = new GraphElements<Data>();
  links = new GraphLinks();

  constructor(graph: dia.Graph) {
    this.update(graph);
  }
  update(graph: dia.Graph): void {
    const cells = graph.get('cells');
    if (!cells) {
      throw new Error('Graph cells are not initialized');
    }
    let areElementsChanged = false;
    let areLinksChanged = false;
    for (const cell of cells) {
      if (cell.isElement()) {
        const newElement = getElement<Data>(cell);
        if (util.isEqual(newElement, this.elements.get(cell.id))) {
          continue;
        }
        areElementsChanged = true;
        this.elements.set(cell.id, newElement);
      }
      if (cell.isLink()) {
        const newLink = getLink(cell);
        if (util.isEqual(newLink, this.links.get(cell.id))) {
          continue;
        }
        areLinksChanged = true;
        this.links.set(cell.id, newLink);
      }
      if (areElementsChanged) {
        this.elements = new GraphElements<Data>([...this.elements.values()]);
      }
      if (areLinksChanged) {
        this.links = new GraphLinks([...this.links.values()]);
      }
    }
  }
}
