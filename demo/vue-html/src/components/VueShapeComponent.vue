<template>
	<div ref="instance" class="html-element" :data-state="stateVal">
		<span :id="id + '-header'" class="html-element-header">{{ headerVal }}</span>
		<label class="html-element-label">
			<input :id="id + '-name'" class="html-element-field" placeholder="Name" :value="nameVal" @input="onUpdateName" />
		</label>
		<label class="html-element-label">
			<select :id="id + '-select'" class="html-element-field" @change="onUpdateSelect">
				<option value="" :selected="!resourceVal"></option>
				<option value="john" :selected="resourceVal === 'john'">John</option>
				<option value="mary" :selected="resourceVal === 'mary'">Mary</option>
				<option value="bob" :selected="resourceVal === 'bob'">Bob</option>
			</select>
		</label>
	</div>
</template>

<script>
export default {
	name: 'VueShapeComponent',

	props: {
		viewId: { required: true, type: String },
		header: { default: '', type: String },
		name: { default: '', type: String },
		resource: { default: '', type: String },
		state: { default: '', type: String },
		bbox: { required: true, type: Object }
	},

	data() {
		return {
			id: this.viewId,
			headerVal: this.header,
			nameVal: this.name,
			resourceVal: this.resource,
			stateVal: this.state
		};
	},

	watch: {
		bbox: function(newVal) {
			this.updatePosition(newVal);
		},

		zIndex: function(newVal) {
			this.updateZIndex(newVal);
		},

		name: function(newValue) {
			this.nameVal = newValue;
		},

		resource: function(newValue) {
			this.resourceVal = newValue;
		},

		state: function(newValue) {
			this.stateVal = newValue;
		}
	},

	mounted() {
		this.updatePosition(this.bbox);
	},

	methods: {
		updatePosition(bbox) {
			const ref = this.$refs.instance;
			ref.style.width = bbox.width + 'px';
			ref.style.height = bbox.height + 'px';
			ref.style.left = bbox.x + 'px';
			ref.style.top = bbox.y + 'px';
		},

		updateZIndex(z) {
			const ref = this.$refs.instance;
			ref.style.zIndex = z;
		},

		onUpdateName(ev) {
			const value = ev.target.value;
			this.$emit('nameChange', this.viewId, value);
		},

		onUpdateSelect(ev) {
			const value = ev.target.value;
			this.$emit('resourceChange', this.viewId, value);
		}
	}
};
</script>

<style>
	@import '../styles/shapeComponent.css';
</style>
