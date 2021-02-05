import 'jointjs/dist/joint.core.css';
import { dia } from 'jointjs/src/core.mjs';
import { AppShape, AppShapeView } from '@/shapes/appShape';
import * as standard from 'jointjs/src/shapes/standard.mjs';

export default {
	install: function (Vue) {
		let joint = { dia };
		const app = { AppShape, AppShapeView };
		joint.shapes = { standard, app };
		Object.defineProperty(Vue.prototype, '$joint', { value: joint });
	}
};
