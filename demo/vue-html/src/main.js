import Vue from 'vue';
import App from '@/App';
import RappidPlugin from '@/plugins/rappid';

Vue.use(RappidPlugin);

new Vue({
	el: '#app',
	render: h => h(App)
});
