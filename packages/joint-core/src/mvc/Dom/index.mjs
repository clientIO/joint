import { default as $ } from './Dom.mjs';
import * as methods from './methods.mjs';
import { special } from './events.mjs';

Object.assign($.fn, methods);
Object.assign($.event.special, special);

export default $;

