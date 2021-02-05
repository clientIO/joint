<template>
	<div class="container">
		<joint-paper :background="background" @init="initialize" />
		<div class="toolbar">
			<span ref="zoomOut" class="toolbar-button" @click="zoomOut">Zoom Out</span>
			<span ref="zoomIn" class="toolbar-button" @click="zoomIn">Zoom In</span>
			<span ref="reset" class="toolbar-button" @click="resetShapes">Reset</span>
		</div>
	</div>
</template>

<script>
import { AppShape } from '@/shapes/appShape';
import JointPaper from '@/components/JointPaper';

export default {
	name: 'App',

	components: {
		JointPaper
	},

	data() {
		return {
			background: {
				color: '#F3F7F6'
			}
		};
	},

	methods: {
		initialize(paper) {
			this.$options.paper = paper;
			this.$options.zoomLevel = 1;
			this.setupGraph();
		},

		setupGraph() {
			const appShape = new AppShape({
				position: { x: 16, y: 150 },
				fields: {
					header: 'Task',
					name: 'Create Story',
					resource: 'bob',
					state: 'done'
				}
			});
			const appShape2 = new AppShape({
				position: { x: 298, y: 150 },
				fields: {
					header: 'Task',
					name: 'Promote',
					resource: 'mary'
				}
			});
			const appShape3 = new AppShape({
				position: { x: 580, y: 150 },
				fields: {
					header: 'Task',
					name: 'Measure',
					resource: 'john',
					state: 'at-risk'
				}
			});

			const link = new this.$joint.shapes.standard.Link({
				source: { id: appShape.id },
				target: { id: appShape2.id },
				attrs: {
					line: {
						stroke: '#464554'
					}
				}
			});

			const link2 = new this.$joint.shapes.standard.Link({
				source: { id: appShape2.id },
				target: { id: appShape3.id },
				attrs: {
					line: {
						stroke: '#464554'
					}
				}
			});

			this.$options.paper.model.resetCells([appShape, appShape2, appShape3, link, link2]);
		},

		zoomOut() {
			const currentZoomLevel = this.$options.zoomLevel;
			const paper = this.$options.paper;
			this.$options.zoomLevel = Math.max(0.2, currentZoomLevel - 0.2);
			const size = paper.getComputedSize();
			paper.translate(0,0);
			paper.scale(this.$options.zoomLevel, this.$options.zoomLevel, size.width / 2, size.height / 2);
		},

		zoomIn() {
			const currentZoomLevel = this.$options.zoomLevel;
			const paper = this.$options.paper;
			this.$options.zoomLevel = Math.min(3, currentZoomLevel + 0.2);
			const size = paper.getComputedSize();
			paper.translate(0,0);
			paper.scale(this.$options.zoomLevel, this.$options.zoomLevel, size.width / 2, size.height / 2);
		},

		resetShapes() {
			this.$options.paper.model.getElements().forEach(element => {
				element.prop(['fields', 'name'], '', { resetFields: true });
				element.prop(['fields', 'resource'], '', { resetFields: true });
				element.prop(['fields', 'state'], '', { resetFields: true });
			});
		}
	}
};
</script>

<style>
	.container {
		width: 850px;
		position: relative;
		overflow: hidden;
	}
</style>
