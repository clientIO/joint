<template>
	<div ref="container" class="html-elements-container">
		<vue-shape-component v-for="item in vueShapeComponents"
			:key="item.id"
			:header="item.header"
			:name="item.name"
			:resource="item.resource"
			:view-id="item.id"
			:state="item.state"
			:bbox="item.bbox"
			@resourceChange="onResourceChange"
			@nameChange="onNameChange"
		>
		</vue-shape-component>
	</div>
</template>

<script>
import VueShapeComponent from './VueShapeComponent';

export default {
	name: 'VueShapeViewsContainer',

	components: {
		VueShapeComponent
	},

	data() {
		return {
			vueShapeComponents: []
		};
	},

	methods: {
		updatePosition(transform) {
			const ref = this.$refs.container;
			ref.style.transformOrigin = '0 0';
			ref.style.transform = transform;
		},

		addView(id, model) {
			const fields = model.prop('fields');
			const item = {
				id: id,
				header: fields.header,
				name: fields.name,
				resource: fields.resource,
				state: fields.state,
				bbox: model.getBBox(),
				shape: model,
				zIndex: model.get('z') || 0
			};
			this.vueShapeComponents.push(item);
		},

		updateShapeViewBBox(id, bbox) {
			const shape = this.findComponent(id);
			shape.bbox = bbox;
		},

		updateShapeViewZIndex(id, value) {
			const shape = this.findComponent(id);
			shape.zIndex = value;
		},

		removeView(id) {
			const idx = this.vueShapeComponents.findIndex(s => s.id === id);
			if (idx !== -1) {
				this.vueShapeComponents.splice(idx, 1);
			}
		},

		resetShapeView(id) {
			const item = this.findComponent(id);
			item.name = '';
			item.resource = '';
			item.state = '';
		},

		onResourceChange(id, value) {
			const item = this.findComponent(id);
			const shape = item.shape;
			shape.prop('fields/resource', value);
			item.resource = value;
		},

		onNameChange(id, value) {
			const item = this.findComponent(id);
			const shape = item.shape;
			shape.prop('fields/name', value);
			item.name = value;
		},

		findComponent(id) {
			return this.vueShapeComponents.find(s => s.id === id);
		}
	}
};
</script>

<style>
	.html-elements-container {
		pointer-events: none;
		position: absolute;
		inset: 0;
	}
</style>
