import { default as $ } from './Dom.mjs';
import * as methods from './methods.mjs';
import * as animations from './animations.mjs';
import { default as props } from './props.mjs';
import { default as special } from './events.mjs';

Object.assign($.fn, methods);
Object.assign($.fn, animations);
Object.assign($.fn, props);
Object.assign($.event.special, special);

export default $;

