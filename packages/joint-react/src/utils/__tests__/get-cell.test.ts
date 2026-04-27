import { dia, shapes } from '@joint/core';
import { mapAttributesToLink } from '../../state/data-mapping';
import { ElementModel } from '../../models/element-model';
import { LinkModel, LINK_MODEL_TYPE } from '../../models/link-model';

const DEFAULT_CELL_NAMESPACE = { ...shapes, element: ElementModel, link: LinkModel };

describe('graph-state-selectors link mapping', () => {
  let graph: dia.Graph;

  beforeEach(() => {
    graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
  });

  afterEach(() => {
    graph.clear();
  });

  describe('attributesToLink', () => {
    it('should extract link attributes correctly', () => {
      const id = 'link-1';
      const cellJson = {
        type: LINK_MODEL_TYPE,
        id,
        source: { id: 'source-id' },
        target: { id: 'target-id' },
        z: 1,
        data: { key: 'value' },
      } as dia.Cell.JSON;
      graph.addCell(cellJson);
      const cell = graph.getCell(id) as dia.Link;

      const link = mapAttributesToLink(cell.attributes);

      expect(link).toMatchObject({
        source: { id: 'source-id' },
        target: { id: 'target-id' },
      });
      // User data is in the data field
      expect(link.data).toMatchObject({ key: 'value' });
      // Internal JointJS properties are not mapped back
      expect(link).not.toHaveProperty('id');
      expect(link).not.toHaveProperty('markup');
      expect(link).not.toHaveProperty('defaultLabel');
    });
  });
});
