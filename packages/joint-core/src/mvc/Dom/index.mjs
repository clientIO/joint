import { default as $ } from './Dom.mjs';
import * as methods from './methods.mjs';
import * as props from './props.mjs';
import { special } from './events.mjs';

Object.assign($.fn, methods);
Object.assign($.fn, props);
Object.assign($.event.special, special);

export default $;

