/*!
 * jQuery corner plugin: simple corner rounding
 * Examples and documentation at: http://jquery.malsup.com/corner/
 * version 2.01 (08-SEP-2009)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 */

/**
 *  corner() takes a single string argument:  $('#myDiv').corner("effect corners width")
 *
 *  effect:  name of the effect to apply, such as round, bevel, notch, bite, etc (default is round). 
 *  corners: one or more of: top, bottom, tr, tl, br, or bl. 
 *           by default, all four corners are adorned. 
 *  width:   width of the effect; in the case of rounded corners this is the radius. 
 *           specify this value using the px suffix such as 10px (and yes, it must be pixels).
 *
 * @author Dave Methvin (http://methvin.com/jquery/jq-corner.html)
 * @author Mike Alsup   (http://jquery.malsup.com/corner/)
 */
;(function($) { 

var moz = $.browser.mozilla && /gecko/i.test(navigator.userAgent);
var webkit = $.browser.safari && $.browser.version >= 3;

var expr = $.browser.msie && (function() {
    var div = document.createElement('div');
    try { div.style.setExpression('width','0+0'); }
    catch(e) { return false; }
    return true;
})();
    
function sz(el, p) { 
    return parseInt($.css(el,p))||0; 
};
function hex2(s) {
    var s = parseInt(s).toString(16);
    return ( s.length < 2 ) ? '0'+s : s;
};
function gpc(node) {
    for ( ; node && node.nodeName.toLowerCase() != 'html'; node = node.parentNode ) {
        var v = $.css(node,'backgroundColor');
        if (v == 'rgba(0, 0, 0, 0)')
            continue; // webkit
        if (v.indexOf('rgb') >= 0) { 
            var rgb = v.match(/\d+/g); 
            return '#'+ hex2(rgb[0]) + hex2(rgb[1]) + hex2(rgb[2]);
        }
        if ( v && v != 'transparent' )
            return v;
    }
    return '#ffffff';
};

function getWidth(fx, i, width) {
    switch(fx) {
    case 'round':  return Math.round(width*(1-Math.cos(Math.asin(i/width))));
    case 'cool':   return Math.round(width*(1+Math.cos(Math.asin(i/width))));
    case 'sharp':  return Math.round(width*(1-Math.cos(Math.acos(i/width))));
    case 'bite':   return Math.round(width*(Math.cos(Math.asin((width-i-1)/width))));
    case 'slide':  return Math.round(width*(Math.atan2(i,width/i)));
    case 'jut':    return Math.round(width*(Math.atan2(width,(width-i-1))));
    case 'curl':   return Math.round(width*(Math.atan(i)));
    case 'tear':   return Math.round(width*(Math.cos(i)));
    case 'wicked': return Math.round(width*(Math.tan(i)));
    case 'long':   return Math.round(width*(Math.sqrt(i)));
    case 'sculpt': return Math.round(width*(Math.log((width-i-1),width)));
    case 'dog':    return (i&1) ? (i+1) : width;
    case 'dog2':   return (i&2) ? (i+1) : width;
    case 'dog3':   return (i&3) ? (i+1) : width;
    case 'fray':   return (i%2)*width;
    case 'notch':  return width; 
    case 'bevel':  return i+1;
    }
};

$.fn.corner = function(options) {
    // in 1.3+ we can fix mistakes with the ready state
	if (this.length == 0) {
        if (!$.isReady && this.selector) {
            var s = this.selector, c = this.context;
            $(function() {
                $(s,c).corner(options);
            });
        }
        return this;
	}

    return this.each(function(index){
		var $this = $(this);
		var o = (options || $this.attr($.fn.corner.defaults.metaAttr) || '').toLowerCase();
		var keep = /keep/.test(o);                       // keep borders?
		var cc = ((o.match(/cc:(#[0-9a-f]+)/)||[])[1]);  // corner color
		var sc = ((o.match(/sc:(#[0-9a-f]+)/)||[])[1]);  // strip color
		var width = parseInt((o.match(/(\d+)px/)||[])[1]) || 10; // corner width
		var re = /round|bevel|notch|bite|cool|sharp|slide|jut|curl|tear|fray|wicked|sculpt|long|dog3|dog2|dog/;
		var fx = ((o.match(re)||['round'])[0]);
		var edges = { T:0, B:1 };
		var opts = {
			TL:  /top|tl|left/.test(o),       TR:  /top|tr|right/.test(o),
			BL:  /bottom|bl|left/.test(o),    BR:  /bottom|br|right/.test(o)
		};
		if ( !opts.TL && !opts.TR && !opts.BL && !opts.BR )
			opts = { TL:1, TR:1, BL:1, BR:1 };
			
		// support native rounding
		if ($.fn.corner.defaults.useNative && fx == 'round' && (moz || webkit) && !cc && !sc) {
			if (opts.TL)
				$this.css(moz ? '-moz-border-radius-topleft' : '-webkit-border-top-left-radius', width + 'px');
			if (opts.TR)
				$this.css(moz ? '-moz-border-radius-topright' : '-webkit-border-top-right-radius', width + 'px');
			if (opts.BL)
				$this.css(moz ? '-moz-border-radius-bottomleft' : '-webkit-border-bottom-left-radius', width + 'px');
			if (opts.BR)
				$this.css(moz ? '-moz-border-radius-bottomright' : '-webkit-border-bottom-right-radius', width + 'px');
			return;
		}
			
		var strip = document.createElement('div');
		strip.style.overflow = 'hidden';
		strip.style.height = '1px';
		strip.style.backgroundColor = sc || 'transparent';
		strip.style.borderStyle = 'solid';
	
        var pad = {
            T: parseInt($.css(this,'paddingTop'))||0,     R: parseInt($.css(this,'paddingRight'))||0,
            B: parseInt($.css(this,'paddingBottom'))||0,  L: parseInt($.css(this,'paddingLeft'))||0
        };

        if (typeof this.style.zoom != undefined) this.style.zoom = 1; // force 'hasLayout' in IE
        if (!keep) this.style.border = 'none';
        strip.style.borderColor = cc || gpc(this.parentNode);
        var cssHeight = $.curCSS(this, 'height');

        for (var j in edges) {
            var bot = edges[j];
            // only add stips if needed
            if ((bot && (opts.BL || opts.BR)) || (!bot && (opts.TL || opts.TR))) {
                strip.style.borderStyle = 'none '+(opts[j+'R']?'solid':'none')+' none '+(opts[j+'L']?'solid':'none');
                var d = document.createElement('div');
                $(d).addClass('jquery-corner');
                var ds = d.style;

                bot ? this.appendChild(d) : this.insertBefore(d, this.firstChild);

                if (bot && cssHeight != 'auto') {
                    if ($.css(this,'position') == 'static')
                        this.style.position = 'relative';
                    ds.position = 'absolute';
                    ds.bottom = ds.left = ds.padding = ds.margin = '0';
                    if (expr)
                        ds.setExpression('width', 'this.parentNode.offsetWidth');
                    else
                        ds.width = '100%';
                }
                else if (!bot && $.browser.msie) {
                    if ($.css(this,'position') == 'static')
                        this.style.position = 'relative';
                    ds.position = 'absolute';
                    ds.top = ds.left = ds.right = ds.padding = ds.margin = '0';
                    
                    // fix ie6 problem when blocked element has a border width
                    if (expr) {
                        var bw = sz(this,'borderLeftWidth') + sz(this,'borderRightWidth');
                        ds.setExpression('width', 'this.parentNode.offsetWidth - '+bw+'+ "px"');
                    }
                    else
                        ds.width = '100%';
                }
                else {
                	ds.position = 'relative';
                    ds.margin = !bot ? '-'+pad.T+'px -'+pad.R+'px '+(pad.T-width)+'px -'+pad.L+'px' : 
                                        (pad.B-width)+'px -'+pad.R+'px -'+pad.B+'px -'+pad.L+'px';                
                }

                for (var i=0; i < width; i++) {
                    var w = Math.max(0,getWidth(fx,i, width));
                    var e = strip.cloneNode(false);
                    e.style.borderWidth = '0 '+(opts[j+'R']?w:0)+'px 0 '+(opts[j+'L']?w:0)+'px';
                    bot ? d.appendChild(e) : d.insertBefore(e, d.firstChild);
                }
            }
        }
    });
};

$.fn.uncorner = function() { 
	if (moz || webkit)
		this.css(moz ? '-moz-border-radius' : '-webkit-border-radius', 0);
	$('div.jquery-corner', this).remove();
	return this;
};

// expose options
$.fn.corner.defaults = {
	useNative: true, // true if plugin should attempt to use native browser support for border radius rounding
	metaAttr:  'data-corner' // name of meta attribute to use for options
};
    
})(jQuery);
