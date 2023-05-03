import { dia, util } from 'jointjs';
import { isCellHidden } from '../utils';
import { CARD_PORT_BG_COLOR, CARD_PORT_COLOR, CARD_PORT_LABEL_COLOR } from '../../theme';

export interface CardAttributes extends dia.Element.Attributes {
    hidden?: boolean;
    attrs?: any;
}

export abstract class Card extends dia.Element<CardAttributes> {
    defaults(): Partial<CardAttributes> {
        return {
            hidden: false,
            ports: {
                groups: {
                    left: {
                        position: {
                            name: 'left'
                        }
                    },
                    right: {
                        position: {
                            name: 'right'
                        }
                    },
                    top: {
                        position: {
                            name: 'top'
                        }
                    },
                    bottom: {
                        position: {
                            name: 'bottom'
                        }
                    }
                }
            }
        }
    }

    static createPort(id: string, group: string): dia.Element.Port {

        const isTopLeft = group === 'left' || group === 'top';

        return {
            id,
            group,
            attrs: {
                portRoot: {
                    // Make the links connect only to the portBody circle, not the label
                    magnetSelector: 'portBody',
                },
                portBody: {
                    magnet: 'passive',
                    r: 5,
                    stroke: CARD_PORT_COLOR,
                    strokeWidth: 3,
                    fill: CARD_PORT_BG_COLOR,
                },
                portLabel: {
                    text: id,
                    x: isTopLeft ? -6 : 6,
                    y: isTopLeft ? -6 : 6,
                    fill: CARD_PORT_LABEL_COLOR,
                    fontSize: 11,
                    fontFamily: 'sans-serif',
                    textVerticalAnchor: isTopLeft ? 'bottom' : 'top',
                    textAnchor: isTopLeft ? 'end' : 'start',
                }
            },
            markup: util.svg`
                <circle @selector="portBody" />
                <text @selector="portLabel" />
            `,
            label: {
                // Don't use the separate markup and therefore the positioning logic for the label
                // We defined the label in the port markup above
                markup: []
            }
        }
    }

    static isCard(cell: dia.Cell): cell is Card {
        return cell instanceof Card;
    }
}

export class CardView extends dia.ElementView {

    presentationAttributes(): dia.CellView.PresentationAttributes {
        return dia.ElementView.addPresentationAttributes({
            hidden: [dia.ElementView.Flags.UPDATE]
        });
    }

    getMagnetFromLinkEnd(end) {
      const { model, paper } = this;
      if (!isCellHidden(model)) {
        // Use the default implementation for visible elements.
        return super.getMagnetFromLinkEnd(end);
      }
      const parent = model.getParentCell();
      if (!parent) return null;
      // Use the parent element node.
      return parent.findView(paper).el;
    }
}
