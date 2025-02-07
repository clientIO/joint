import { dia } from '@joint/core'

// Event name for when the portal is ready
export type PortalEvent = 'portal:ready'
export const PAPER_PORTAL_RENDER_EVENT: PortalEvent = 'portal:ready'
// Interface for Paper options, extending JointJS Paper options
export interface PaperOptions extends dia.Paper.Options {
  /**
   * The selector of the portal element.
   */
  readonly portalSelector?: string | ((view: dia.ElementView) => HTMLElement | null)
}

/**
 * Function to create a new JointJS Paper
 */
export function createPaper(graph: dia.Graph, options?: PaperOptions) {
  const { portalSelector = 'portal', ...restOptions } = options ?? {}

  const elementView = dia.ElementView.extend({
    onRender() {
      let portalElement =
        typeof portalSelector === 'function' ? portalSelector(this) : portalSelector
      if (typeof portalElement === 'string') {
        portalElement = this.findNode(portalElement)
      }

      if (portalElement) {
        this.notify(PAPER_PORTAL_RENDER_EVENT, portalElement)
      }
    },
  })

  // Create a new JointJS Paper with the provided options
  const paper = new dia.Paper({
    width: '100%',
    height: '100%',
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    preventDefaultBlankAction: false,
    // TODO: It is possible to override it. We need to instruct
    // the users to trigger the PORTAL_READY_EVENT event manually
    // or find a better way to do it (e.g. trigger the event in JointJS)
    elementView,
    ...restOptions,
    frozen: true,
    model: graph,
  })

  // Return the created paper
  return paper
}
