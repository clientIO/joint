this["joint"] = this["joint"] || {};
this["joint"]["templates"] = this["joint"]["templates"] || {};
this["joint"]["templates"]["arrowheadMarkup"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<g class="marker-arrowhead-group marker-arrowhead-group-' +
((__t = ( end )) == null ? '' : __t) +
'"><path class="marker-arrowhead" end="' +
((__t = ( end )) == null ? '' : __t) +
'" d="M 26 0 L 0 13 L 26 26 z" /></g>';

}
return __p
};
this["joint"]["templates"]["blurFilter"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<filter><feGaussianBlur stdDeviation="' +
((__t = (stdDeviation)) == null ? '' : __t) +
'"/></filter>';

}
return __p
};
this["joint"]["templates"]["brightness"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<filter><feComponentTransfer><feFuncR type="table" tableValues="' +
((__t = (amount)) == null ? '' : __t) +
' ' +
((__t = (amount2)) == null ? '' : __t) +
'"/><feFuncG type="table" tableValues="' +
((__t = (amount)) == null ? '' : __t) +
' ' +
((__t = (amount2)) == null ? '' : __t) +
'"/><feFuncB type="table" tableValues="' +
((__t = (amount)) == null ? '' : __t) +
' ' +
((__t = (amount2)) == null ? '' : __t) +
'"/></feComponentTransfer></filter>';

}
return __p
};
this["joint"]["templates"]["contrast"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<filter><feComponentTransfer><feFuncR type="linear" slope="' +
((__t = (amount)) == null ? '' : __t) +
'" intercept="' +
((__t = (amount2)) == null ? '' : __t) +
'"/><feFuncG type="linear" slope="' +
((__t = (amount)) == null ? '' : __t) +
'" intercept="' +
((__t = (amount2)) == null ? '' : __t) +
'"/><feFuncB type="linear" slope="' +
((__t = (amount)) == null ? '' : __t) +
'" intercept="' +
((__t = (amount2)) == null ? '' : __t) +
'"/></feComponentTransfer></filter>';

}
return __p
};
this["joint"]["templates"]["dropShadow"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<filter><feDropShadow stdDeviation="' +
((__t = (blur)) == null ? '' : __t) +
'" dx="' +
((__t = (dx)) == null ? '' : __t) +
'" dy="' +
((__t = (dy)) == null ? '' : __t) +
'" flood-color="' +
((__t = (color)) == null ? '' : __t) +
'" flood-opacity="' +
((__t = (opacity)) == null ? '' : __t) +
'"/></filter>';

}
return __p
};
this["joint"]["templates"]["grayScale"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<filter><feColorMatrix type="matrix" values="' +
((__t = (a)) == null ? '' : __t) +
' ' +
((__t = (b)) == null ? '' : __t) +
' ' +
((__t = (c)) == null ? '' : __t) +
' 0 0 ' +
((__t = (d)) == null ? '' : __t) +
' ' +
((__t = (e)) == null ? '' : __t) +
' ' +
((__t = (f)) == null ? '' : __t) +
' 0 0 ' +
((__t = (g)) == null ? '' : __t) +
' ' +
((__t = (b)) == null ? '' : __t) +
' ' +
((__t = (h)) == null ? '' : __t) +
' 0 0 0 0 0 1 0"/></filter>';

}
return __p
};
this["joint"]["templates"]["guassianDropShadow"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<filter><feGaussianBlur in="SourceAlpha" stdDeviation="' +
((__t = (blur)) == null ? '' : __t) +
'"/><feOffset dx="' +
((__t = (dx)) == null ? '' : __t) +
'" dy="' +
((__t = (dy)) == null ? '' : __t) +
'" result="offsetblur"/><feFlood flood-color="' +
((__t = (color)) == null ? '' : __t) +
'"/><feComposite in2="offsetblur" operator="in"/><feComponentTransfer><feFuncA type="linear" slope="' +
((__t = (opacity)) == null ? '' : __t) +
'"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>';

}
return __p
};
this["joint"]["templates"]["hueRotate"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<filter><feColorMatrix type="matrix" values="' +
((__t = (a)) == null ? '' : __t) +
' ' +
((__t = (b)) == null ? '' : __t) +
' ' +
((__t = (c)) == null ? '' : __t) +
' 0 0 ' +
((__t = (d)) == null ? '' : __t) +
' ' +
((__t = (e)) == null ? '' : __t) +
' ' +
((__t = (f)) == null ? '' : __t) +
' 0 0 ' +
((__t = (g)) == null ? '' : __t) +
' ' +
((__t = (h)) == null ? '' : __t) +
' ' +
((__t = (i)) == null ? '' : __t) +
' 0 0 0 0 0 1 0"/></filter>';

}
return __p
};
this["joint"]["templates"]["invert"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<filter><feComponentTransfer><feFuncR type="table" tableValues="' +
((__t = (amount)) == null ? '' : __t) +
' ' +
((__t = (amount2)) == null ? '' : __t) +
'"/><feFuncG type="table" tableValues="' +
((__t = (amount)) == null ? '' : __t) +
' ' +
((__t = (amount2)) == null ? '' : __t) +
'"/><feFuncB type="table" tableValues="' +
((__t = (amount)) == null ? '' : __t) +
' ' +
((__t = (amount2)) == null ? '' : __t) +
'"/></feComponentTransfer></filter>';

}
return __p
};
this["joint"]["templates"]["labelMarkup"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<g class="label"><rect /><text /></g>';

}
return __p
};
this["joint"]["templates"]["markup"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<path class="connection" stroke="black"/><path class="marker-source" fill="black" stroke="black" /><path class="marker-target" fill="black" stroke="black" /><path class="connection-wrap"/><g class="labels"/><g class="marker-vertices"/><g class="marker-arrowheads"/><g class="link-tools"/>';

}
return __p
};
this["joint"]["templates"]["saturate"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<filter><feColorMatrix type="matrix" values="' +
((__t = (a)) == null ? '' : __t) +
' ' +
((__t = (b)) == null ? '' : __t) +
' ' +
((__t = (c)) == null ? '' : __t) +
' 0 0 ' +
((__t = (d)) == null ? '' : __t) +
' ' +
((__t = (e)) == null ? '' : __t) +
' ' +
((__t = (f)) == null ? '' : __t) +
' 0 0 ' +
((__t = (g)) == null ? '' : __t) +
' ' +
((__t = (h)) == null ? '' : __t) +
' ' +
((__t = (i)) == null ? '' : __t) +
' 0 0 0 0 0 1 0"/></filter>';

}
return __p
};
this["joint"]["templates"]["sepia"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<filter><feColorMatrix type="matrix" values="' +
((__t = (a)) == null ? '' : __t) +
' ' +
((__t = (b)) == null ? '' : __t) +
' ' +
((__t = (c)) == null ? '' : __t) +
' 0 0 ' +
((__t = (d)) == null ? '' : __t) +
' ' +
((__t = (e)) == null ? '' : __t) +
' ' +
((__t = (f)) == null ? '' : __t) +
' 0 0 ' +
((__t = (g)) == null ? '' : __t) +
' ' +
((__t = (h)) == null ? '' : __t) +
' ' +
((__t = (i)) == null ? '' : __t) +
' 0 0 0 0 0 1 0"/></filter>';

}
return __p
};
this["joint"]["templates"]["toolMarkup"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<g class="link-tool"><g class="tool-remove" event="remove"><circle r="11" /><path transform="scale(.8) translate(-16, -16)" d="M24.778,21.419 19.276,15.917 24.777,10.415 21.949,7.585 16.447,13.087 10.945,7.585 8.117,10.415 13.618,15.917 8.116,21.419 10.946,24.248 16.447,18.746 21.948,24.248z"/><title>Remove link.</title></g><g class="tool-options" event="link:options"><circle r="11" transform="translate(25)"/><path fill="white" transform="scale(.55) translate(29, -16)" d="M31.229,17.736c0.064-0.571,0.104-1.148,0.104-1.736s-0.04-1.166-0.104-1.737l-4.377-1.557c-0.218-0.716-0.504-1.401-0.851-2.05l1.993-4.192c-0.725-0.91-1.549-1.734-2.458-2.459l-4.193,1.994c-0.647-0.347-1.334-0.632-2.049-0.849l-1.558-4.378C17.165,0.708,16.588,0.667,16,0.667s-1.166,0.041-1.737,0.105L12.707,5.15c-0.716,0.217-1.401,0.502-2.05,0.849L6.464,4.005C5.554,4.73,4.73,5.554,4.005,6.464l1.994,4.192c-0.347,0.648-0.632,1.334-0.849,2.05l-4.378,1.557C0.708,14.834,0.667,15.412,0.667,16s0.041,1.165,0.105,1.736l4.378,1.558c0.217,0.715,0.502,1.401,0.849,2.049l-1.994,4.193c0.725,0.909,1.549,1.733,2.459,2.458l4.192-1.993c0.648,0.347,1.334,0.633,2.05,0.851l1.557,4.377c0.571,0.064,1.148,0.104,1.737,0.104c0.588,0,1.165-0.04,1.736-0.104l1.558-4.377c0.715-0.218,1.399-0.504,2.049-0.851l4.193,1.993c0.909-0.725,1.733-1.549,2.458-2.458l-1.993-4.193c0.347-0.647,0.633-1.334,0.851-2.049L31.229,17.736zM16,20.871c-2.69,0-4.872-2.182-4.872-4.871c0-2.69,2.182-4.872,4.872-4.872c2.689,0,4.871,2.182,4.871,4.872C20.871,18.689,18.689,20.871,16,20.871z"/><title>Link options.</title></g></g>';

}
return __p
};
this["joint"]["templates"]["vertextMarkup"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<g class="marker-vertex-group" transform="translate(' +
((__t = ( x )) == null ? '' : __t) +
', ' +
((__t = ( y )) == null ? '' : __t) +
')"><circle class="marker-vertex" idx="' +
((__t = ( idx )) == null ? '' : __t) +
'" r="10" /><path class="marker-vertex-remove-area" idx="' +
((__t = ( idx )) == null ? '' : __t) +
'" d="M16,5.333c-7.732,0-14,4.701-14,10.5c0,1.982,0.741,3.833,2.016,5.414L2,25.667l5.613-1.441c2.339,1.317,5.237,2.107,8.387,2.107c7.732,0,14-4.701,14-10.5C30,10.034,23.732,5.333,16,5.333z" transform="translate(5, -33)"/><path class="marker-vertex-remove" idx="' +
((__t = ( idx )) == null ? '' : __t) +
'" transform="scale(.8) translate(9.5, -37)" d="M24.778,21.419 19.276,15.917 24.777,10.415 21.949,7.585 16.447,13.087 10.945,7.585 8.117,10.415 13.618,15.917 8.116,21.419 10.946,24.248 16.447,18.746 21.948,24.248z"><title>Remove vertex.</title></path></g>';

}
return __p
};