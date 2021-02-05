import { dia } from 'jointjs/src/core.mjs';
import { appShapeAttributes } from '@/shapes/appShapeAttributes';

export class AppShape extends dia.Element {
	defaults() {
		return appShapeAttributes;
	}
}

// Custom view for JointJS HTML element that displays an HTML <div></div> above the SVG Element.
export class AppShapeView extends dia.ElementView {

	onRender() {
		this.model.on('change:position change:size', () => this.updateHTMLBBox());
		this.model.on('change:fields', (shape, val, opt) => this.onUpdateFieldsProp(opt));
		this.model.on('change:z', () => this.updateHTMLZIndex());
		this.removeHTMLMarkup();
		this.renderHTMLMarkup();
		return this;
	}

	removeHTMLMarkup() {
		this.paper.vueShapeViewsContainer.removeView(this.id);
	}

	renderHTMLMarkup() {
		this.paper.vueShapeViewsContainer.addView(this.id, this.model);
	}

	updateHTMLBBox() {
		const bbox = this.model.getBBox();
		this.paper.vueShapeViewsContainer.updateShapeViewBBox(this.id, bbox);
	}

	onUpdateFieldsProp(opt) {
		if (opt.resetFields) {
			this.paper.vueShapeViewsContainer.resetShapeView(this.id);
		}
	}

	updateHTMLZIndex() {
		const z = this.model.get('z') || 0;
		this.paper.vueShapeComponents.updateShapeViewZIndex(this.id, z);
	}

	onRemove() {
		this.removeHTMLMarkup();
	}
}
