export const appShapeAttributes = {
	type: 'app.AppShape',
	size: { width: 250, height: 228 },
	fields: {
		header: '',
		name: '',
		resource: '',
		state: ''
	},
	attrs: {
		placeholder: {
			refWidth: '100%',
			refHeight: '100%',
			fill: 'transparent',
			stroke: '#D4D4D4'
		}
	},
	markup: [{
		tagName: 'rect',
		selector: 'placeholder'
	}]
};
