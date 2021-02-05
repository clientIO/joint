<template>
	<div ref="joint"></div>
</template>

<script>
import Vue from 'vue';
import { V } from 'jointjs/src/core.mjs';
import VueShapeViewsContainer from './VueShapeViewsContainer';

export default {
	name: 'JointPaper',

	props: {
		width: {
			type: [String, Number],
			default: 850
		},
		height: {
			type: [String, Number],
			default: 600
		},
		background: {
			type: [Object, Boolean],
			default: false
		}
	},

	created() {
		this.name = this.$options.name;
		this.graph = new this.$joint.dia.Graph({}, { cellNamespace: this.$joint.shapes });
	},

	mounted() {
		const paper = new this.$joint.dia.Paper({
			el: this.$refs.joint,
			cellViewNamespace: this.$joint.shapes,
			model: this.graph,
			width: this.width,
			height: this.height,
			background: this.background,
		});

		// instantiate shape views container
		const cClass = Vue.extend(VueShapeViewsContainer);

		const vueShapeViewsContainer = new cClass();

		vueShapeViewsContainer.$mount();

		this.$refs.joint.appendChild(vueShapeViewsContainer.$el);

		paper.vueShapeViewsContainer = vueShapeViewsContainer;

		paper.on('blank:pointerdown cell:pointerdown', function () {
			document.activeElement.blur();
		});

		paper.on('scale translate', function() {
			// Update the css transformation of all JointJS HTML Elements
			vueShapeViewsContainer.updatePosition(V.matrixToTransformString(this.matrix()));
		});

		this.$emit('init', paper);
	}
};
</script>
