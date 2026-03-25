/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable jsdoc/require-jsdoc */
import { util, type dia } from '@joint/core';
import type { FlatElementData } from '../types/element-types';
import type { FlatLinkData } from '../types/link-types';
import {
  defaultMapDataToElementAttributes,
  defaultMapDataToLinkAttributes,
  defaultMapElementAttributesToData,
  defaultMapLinkAttributesToData,
  type GraphMappings,
} from '../state/data-mapping';
import { resolveCellDefaults, type PaperStore } from '../internal';
import { graphChanges } from './graph-changes';
import { asReadonlyContainer, createContainer } from './state-container';
import type { ElementLayout, LinkLayout } from '..';
import { getLinkLayout } from './update-layout-state';

export interface ElementToData<ElementData = FlatElementData> {
  readonly element: dia.Element;
  readonly previousData?: ElementData;
}

export interface LinkToData<LinkData = FlatLinkData> {
  readonly link: dia.Link;
  readonly previousData?: LinkData;
}

export interface ElementToAttributes<ElementData = FlatElementData> {
  readonly id: string;
  readonly data: ElementData;
}

export interface LinkToAttributes<LinkData = FlatLinkData> {
  readonly id?: string;
  readonly data: LinkData;
}

interface GraphViewState<ElementData = FlatElementData, LinkData = FlatLinkData>
  extends GraphMappings<ElementData, LinkData> {
  readonly graph: dia.Graph;
  readonly enableBatchUpdates?: boolean;
  readonly getPaperStores: () => Map<string, PaperStore>;
}

export type ElementToAttribute<ElementData = FlatElementData> = (
  options: ElementToAttributes<ElementData>
) => dia.Cell.JSON;
export type LinkToAttribute<LinkData = FlatLinkData> = (
  options: LinkToAttributes<LinkData>
) => dia.Cell.JSON;

export interface GraphView<ElementData = FlatElementData, LinkData = FlatLinkData> {
  readonly elements: ReturnType<typeof asReadonlyContainer<ElementData>>;
  readonly links: ReturnType<typeof asReadonlyContainer<LinkData>>;
  readonly elementsLayout: ReturnType<typeof asReadonlyContainer<ElementLayout>>;
  readonly linksLayout: ReturnType<typeof asReadonlyContainer<Record<string, LinkLayout>>>;
  destroy: () => void;
}
export function graphView<ElementData = FlatElementData, LinkData = FlatLinkData>(
  options: GraphViewState<ElementData, LinkData>
): GraphView<ElementData, LinkData> {
  const {
    graph,
    mapDataToElementAttributes = defaultMapDataToElementAttributes,
    mapDataToLinkAttributes = defaultMapDataToLinkAttributes,
    mapElementAttributesToData = defaultMapElementAttributesToData,
    mapLinkAttributesToData = defaultMapLinkAttributesToData,
    getPaperStores,
  } = options;

  const elements = createContainer<ElementData>();
  const links = createContainer<LinkData>();
  const elementsLayout = createContainer<ElementLayout>();
  const linksLayout = createContainer<Record<string, LinkLayout>>();

  function getPreviousElementData(element: dia.Element): ElementData | undefined {
    const { id } = element;
    return elements.get(String(id));
  }

  function getPreviousLinkData(link: dia.Link): LinkData | undefined {
    const { id } = link;
    return links.get(String(id));
  }

  function elementToData({ element, previousData }: ElementToData<ElementData>): ElementData {
    previousData = previousData ?? getPreviousElementData(element);
    const defaultAttributes = resolveCellDefaults(element);
    const id = String(element.id);
    return mapElementAttributesToData({
      id,
      attributes: element.attributes,
      defaultAttributes,
      element,
      graph,
      previousData,
      toData: (attributes) =>
        defaultMapElementAttributesToData({ attributes, defaultAttributes }) as ElementData,
    });
  }

  function elementToAttributes({ id, data }: ElementToAttributes<ElementData>) {
    return mapDataToElementAttributes({
      id,
      data,
      graph,
      toAttributes: (newData) =>
        defaultMapDataToElementAttributes({ id, data: newData as FlatElementData }),
    });
  }

  function linkToData({ link, previousData }: LinkToData<LinkData>): LinkData {
    previousData = previousData ?? getPreviousLinkData(link);
    const defaultAttributes = resolveCellDefaults(link);
    const id = String(link.id);
    return mapLinkAttributesToData({
      id,
      attributes: link.attributes,
      defaultAttributes,
      link,
      graph,
      previousData,
      toData: (attributes) =>
        defaultMapLinkAttributesToData({ attributes, defaultAttributes }) as LinkData,
    });
  }
  function linkToAttributes({ id, data }: LinkToAttributes<LinkData>): dia.Cell.JSON {
    const mapperId = id ?? util.uuid();
    return mapDataToLinkAttributes({
      id: mapperId,
      data,
      graph,
      toAttributes: (newData) =>
        defaultMapDataToLinkAttributes({ id: mapperId, data: newData as FlatLinkData }),
    });
  }

  const graphChangesController = graphChanges({
    elementToAttributes,
    linkToAttributes,
    graph,
    onChanges: ({ changes, onlyLayoutUpdate }) => {
      let hasElementChange = false;
      let hasLinkChange = false;
      let hasElementLayoutChange = false;
      let hasLinkLayoutChange = false;
      for (const [id, change] of changes) {
        const cell = change.data;
        switch (change.type) {
          case 'add':
          case 'change': {
            if (cell.isElement()) {
              const position = cell.position();
              const size = cell.size();
              const angle = cell.angle();
              elementsLayout.set(id, {
                ...position,
                ...size,
                angle,
              });
              hasElementLayoutChange = true;
              if (onlyLayoutUpdate) {
                continue;
              }
              elements.set(id, elementToData({ element: cell }));
              hasElementChange = true;
            } else if (cell.isLink() && getPaperStores) {
              const papers = getPaperStores();
              for (const [paperId, paperStore] of papers) {
                const { paper } = paperStore;
                const linkView = paper.findViewByModel(cell) as dia.LinkView | null;
                if (!linkView) continue;
                const newLinkLayout = getLinkLayout(linkView);
                linksLayout.set(id, {
                  ...linksLayout.get(id),
                  [paperId]: newLinkLayout,
                });
              }
              hasLinkLayoutChange = true;
              if (onlyLayoutUpdate) {
                continue;
              }
              links.set(id, linkToData({ link: cell }));
              hasLinkChange = true;
            }
            break;
          }
          case 'remove': {
            if (cell.isElement()) {
              elements.delete(id);
              hasElementChange = true;
              if (!onlyLayoutUpdate) {
                elementsLayout.delete(id);
                hasElementLayoutChange = true;
              }
            } else if (cell.isLink()) {
              links.delete(id);
              hasLinkChange = true;
              if (!onlyLayoutUpdate) {
                linksLayout.delete(id);
                hasLinkLayoutChange = true;
              }
            }
            break;
          }
        }
      }

      if (hasElementChange) {
        elements.commitChanges();
      }
      if (hasLinkChange) {
        links.commitChanges();
      }
      if (hasElementLayoutChange) {
        elementsLayout.commitChanges();
      }
      if (hasLinkLayoutChange) {
        linksLayout.commitChanges();
      }
      changes.clear();
    },
  });

  return {
    elements: asReadonlyContainer(elements),
    links: asReadonlyContainer(links),
    elementsLayout: asReadonlyContainer(elementsLayout),
    linksLayout: asReadonlyContainer(linksLayout),
    destroy() {
      graphChangesController.destroy();
    },
  };
}
