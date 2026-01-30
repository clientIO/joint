import type { dia } from '@joint/core';
import type { GraphElement } from './element-types';
import type { GraphLink } from './link-types';

/**
 * Unified scheduler data structure for batching all JointJS to React updates.
 * Uses Maps for efficient add/update and delete operations.
 * All fields are optional - only include what needs updating.
 */
export interface GraphSchedulerData {
  // Elements
  readonly elementsToUpdate?: Map<dia.Cell.ID, GraphElement>;
  readonly elementsToDelete?: Map<dia.Cell.ID, true>;

  // Links
  readonly linksToUpdate?: Map<dia.Cell.ID, GraphLink>;
  readonly linksToDelete?: Map<dia.Cell.ID, true>;

  // Ports (nested by element ID)
  readonly portsToUpdate?: Map<dia.Cell.ID, Map<string, dia.Element.Port>>;
  readonly portsToDelete?: Map<dia.Cell.ID, Set<string>>;

  // Port Groups (nested by element ID)
  readonly portGroupsToUpdate?: Map<dia.Cell.ID, Map<string, dia.Element.PortGroup>>;
  readonly portGroupsToDelete?: Map<dia.Cell.ID, Set<string>>;

  // Link attributes
  readonly linkAttrsToUpdate?: Map<dia.Cell.ID, Record<string, unknown>>;

  // Labels (nested by link ID)
  readonly labelsToUpdate?: Map<dia.Cell.ID, Map<string, dia.Link.Label>>;
  readonly labelsToDelete?: Map<dia.Cell.ID, Set<string>>;

  // Views (for React paper updates)
  readonly viewsToUpdate?: Map<dia.Cell.ID, dia.CellView>;
  readonly viewsToDelete?: Map<dia.Cell.ID, true>;

  // Paper update trigger
  readonly shouldUpdatePaper?: boolean;
}
