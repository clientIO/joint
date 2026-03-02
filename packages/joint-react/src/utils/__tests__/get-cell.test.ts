/* eslint-disable unicorn/prevent-abbreviations */
import { dia, shapes } from '@joint/core';
import { defaultMapLinkAttributesToData } from '../../state/data-mapping';
import { ReactElement } from '../../models/react-element';
import { ReactLink, REACT_LINK_TYPE } from '../../models/react-link';
import type { GraphToLinkOptions } from '../../state/graph-state-selectors';
import type { GraphLink } from '../../types/link-types';

const DEFAULT_CELL_NAMESPACE = { ...shapes, ReactElement, ReactLink };

describe('graph-state-selectors link mapping', () => {
  let graph: dia.Graph;

  beforeEach(() => {
    graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
  });

  afterEach(() => {
    graph.clear();
  });

  describe('defaultMapLinkAttributesToData', () => {
    it('should extract link attributes correctly', () => {
      const id = 'link-1';
      const cellJson = {
        type: REACT_LINK_TYPE,
        id,
        source: { id: 'source-id' },
        target: { id: 'target-id' },
        z: 1,
        data: { key: 'value' },
      } as dia.Cell.JSON;
      graph.addCell(cellJson);
      const cell = graph.getCell(id) as dia.Link;

      const link = defaultMapLinkAttributesToData({
        id,
        cell,
        graph,
      } as unknown as GraphToLinkOptions<GraphLink>);

      expect(link).toMatchObject({
        source: 'source-id',
        target: 'target-id',
        key: 'value', // data properties are spread to top level
      });
      // Internal JointJS properties are not mapped back
      expect(link).not.toHaveProperty('id');
      expect(link).not.toHaveProperty('markup');
      expect(link).not.toHaveProperty('defaultLabel');
    });
  });
});
