
import { dia, shapes } from '@joint/core';
import { attributesToLink } from '../../state/data-mapping';
import { PortalElement } from '../../models/portal-element';
import { PortalLink, PORTAL_LINK_TYPE } from '../../models/portal-link';


const DEFAULT_CELL_NAMESPACE = { ...shapes, PortalElement, PortalLink };

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
        type: PORTAL_LINK_TYPE,
        id,
        source: { id: 'source-id' },
        target: { id: 'target-id' },
        z: 1,
        data: { key: 'value' },
      } as dia.Cell.JSON;
      graph.addCell(cellJson);
      const cell = graph.getCell(id) as dia.Link;

      const link = attributesToLink(cell.attributes);

      expect(link).toMatchObject({
        source: 'source-id',
        target: 'target-id',
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
