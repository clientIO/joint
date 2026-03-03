import type { dia } from '@joint/core';
import type { CellId } from './cell-id';
import type { FlatElementData } from './element-types';
import type { FlatLinkData } from './link-types';

/**
 * Unified scheduler data structure for batching all JointJS to React updates.
 * Uses Maps for efficient add/update and delete operations.
 * All fields are optional - only include what needs updating.
 */
export interface GraphSchedulerData {
  // Elements
  readonly elementsToUpdate?: Map<CellId, FlatElementData>;
  readonly elementsToDelete?: Map<CellId, true>;

  // Links
  readonly linksToUpdate?: Map<CellId, FlatLinkData>;
  readonly linksToDelete?: Map<CellId, true>;

  // Ports (nested by element ID)
  readonly portsToUpdate?: Map<CellId, Map<string, dia.Element.Port>>;
  readonly portsToDelete?: Map<CellId, Set<string>>;

  // Port Groups (nested by element ID)
  readonly portGroupsToUpdate?: Map<CellId, Map<string, dia.Element.PortGroup>>;
  readonly portGroupsToDelete?: Map<CellId, Set<string>>;

  // Link attributes
  readonly linkAttrsToUpdate?: Map<CellId, Record<string, unknown>>;

  // Labels (nested by link ID)
  readonly labelsToUpdate?: Map<CellId, Map<string, dia.Link.Label>>;
  readonly labelsToDelete?: Map<CellId, Set<string>>;

  // Views (for React paper updates)
  readonly viewsToUpdate?: Map<CellId, dia.CellView>;
  readonly viewsToDelete?: Map<CellId, true>;

  // Paper update trigger
  readonly shouldUpdatePaper?: boolean;
}
