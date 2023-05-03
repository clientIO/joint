import { dia, highlighters, util } from 'jointjs';
import { Node } from '.';
import { ALERT_COLOR } from '../theme';

export class NodePlaceholder extends dia.HighlighterView {

    padding = 0;

    fontSize = 14;

    preinitialize(): void {
        this.UPDATE_ATTRIBUTES = ['collapsed'];
        this.tagName = 'g';
        this.attributes = {
            'pointer-events': 'none',
        };
        this.children = util.svg`
            <image @selector="image" preserveAspectRatio="xMidYMid" />
            <text @selector="name" text-anchor="middle" font-size="${this.fontSize}" font-family="sans-serif" fill="#ed2637" />
        `;
    }

    protected highlight(nodeView: dia.ElementView, nodeEl: SVGElement): void {
        const { el, fontSize } = this;
        const node = nodeView.model as Node;
        const collapsed = node.isCollapsed();
        if (collapsed) {
            this.renderChildren();
            const { name, image } = this.childNodes;
            const { x, y, width, height } = nodeView.getNodeBoundingRect(nodeEl).inflate(-this.padding);
            // image
            image.setAttribute('x', x.toFixed(2));
            image.setAttribute('y', y.toFixed(2));
            image.setAttribute('width', width.toFixed(2));
            image.setAttribute('height', height.toFixed(2));
            image.setAttribute('href', node.get('image'));
            // name
            name.setAttribute('x', (x + width / 2).toFixed(2));
            name.setAttribute('y', (y + height - fontSize).toFixed(2));
            name.textContent = node.get('name');
            el.style.display = 'block';
        } else {
            el.style.display = 'none';
        }
    }
}

export class ExpandButton extends dia.HighlighterView {

    offset = 20;

    preinitialize(): void {
        this.UPDATE_ATTRIBUTES = ['collapsed'];
        this.attributes = {
            event: 'node:collapse',
        };
        this.children = util.svg`
            <rect @selector="button" fill="#cad8e3" x="-10" y="-10" width="20" height="20" cursor="pointer" stroke="#131e29" stroke-opacity="0.3" />
            <path @selector="icon" fill="none" stroke="#131e29" stroke-width="2" pointer-events="none" />
        `;
    }

    highlight(nodeView: dia.ElementView) {
        const { width } = nodeView.model.size();
        this.renderChildren();
        const { el, childNodes, offset } = this;
        childNodes.icon.setAttribute('d', this.getIconPath(<Node>nodeView.model));
        el.setAttribute('transform', `translate(${width - offset}, ${Node.HEADER_HEIGHT / 2})`);
    }
    getIconPath(node: Node) {
        if (node.isCollapsed()) {
            return 'M -6 0 6 0 M 0 -6 0 6';
        } else {
            return 'M -6 0 6 0';
        }
    }
}

export class NodeAlert extends dia.HighlighterView {

    offset = 45;

    preinitialize(): void {
        const size = 16;
        this.tagName = 'image';
        this.attributes = {
            href: 'assets/alert.svg',
            x: -size / 2,
            y: -size / 2,
            width: size,
            height: size
        }
    }

    protected highlight(nodeView: dia.ElementView): void {
        const { width } = nodeView.model.size();
        const { el, offset } = this;
        el.setAttribute('transform', `translate(${width - offset}, ${Node.HEADER_HEIGHT / 2})`);
        el.classList.add('node-alert');
    }
}

export class LinkAlert extends highlighters.stroke {

    preinitialize(): void {
        this.options.padding = 0;
        this.options.attrs = {
            'stroke': ALERT_COLOR,
            'stroke-dasharray': '1, 30',
            'stroke-width': 10,
            'stroke-linecap': 'round',
            'stroke-linejoin': 'miter',
        }
    }

}

export class PortAlert extends highlighters.stroke {

    preinitialize(): void {
        this.options.padding = 2;
        this.options.attrs = {
            'stroke': ALERT_COLOR,
            'stroke-width': 5
        }
    }

    protected highlight(cellView: dia.CellView, node: SVGElement): void {
        super.highlight(cellView, node);
        this.setLabelColor(node, ALERT_COLOR);
    }

    protected unhighlight(cellView: dia.CellView, node: SVGElement): void {
        super.unhighlight(cellView, node);
        this.setLabelColor(node, '');
    }

    protected setLabelColor(node: SVGElement, color: string): void {
        const label = node.nextElementSibling as SVGElement;
        if (!label || label.tagName !== 'text') return;
        label.style.fill = color;
    }
}

export function toggleCellAlert(cellView: dia.CellView, selector, add: boolean) {
    const { model: cell, paper } = cellView;
    const { id } = cell;
    const { port = null } = selector;
    const alertId = `alert-${id}-${port}`;
    const nodeAlertId = 'node-alert';
    const parent = cell.getParentCell();
    if (add) {
        // Show alert highlighter on the cell
        if (cell.isLink()) {
            LinkAlert.add(cellView, { selector: 'line' }, alertId);
        } else {
            PortAlert.add(cellView, { port, selector: 'portBody' }, alertId);
        }
        // Show alert highlighter on the container
        if (!parent) return;
        const parentView = parent.findView(paper);
        if (NodeAlert.get(parentView, nodeAlertId)) return;
        NodeAlert.add(parentView, 'root', nodeAlertId);
    } else {
        dia.HighlighterView.remove(cellView, alertId);
        if (!parent) return;
        // Remove the alert highlighter from the container if there are no more alerts
        if(parent.getEmbeddedCells().every(cell => {
            const cellView = cell.findView(paper);
            const CellAlert = cell.isLink() ? LinkAlert : PortAlert;
            return CellAlert.get(cellView).length === 0;
        })) {
            NodeAlert.remove(parent.findView(paper), nodeAlertId);
        }
    }
}
