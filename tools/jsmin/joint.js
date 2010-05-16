var NDEBUG = false;
var DBG = [];	// collector for debugging messages
/****************************************************
 * Joint 0.2.0 - JavaScript library for connecting vector objects
 *
 * Copyright (c) 2009 David Durman
 *
 * Licensed under MIT license:
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 ****************************************************/

//(function(){	// BEGIN CLOSURE

/**
 * Global helpers. (not global global only global in the closure)
 */

// Array.indexOf is missing in IE 8
if (!Array.indexOf){
    Array.prototype.indexOf = function (obj, start){
	for (var i = (start || 0), len = this.length; i < len; i++){
	    if (this[i] == obj){
		return i;
	    }
	}
	return -1;
    };
}

/**
 * Get an absolute position of an element.
 * @return point
 */
Joint.findPos = function(el){
    var p = point(0, 0);
    if (el.offsetParent){
	while (el){
	    p.offset(el.offsetLeft, el.offsetTop);
	    el = el.offsetParent;
	}
    }
    return p;
};

/**
 * Get the mouse position relative to the raphael paper.
 * @param <e> Javascript event object
 * @param <r> raphael paper
 * @return <point>
 */
Joint.getMousePosition = function(e, r){
    var pos;
    if (e.pageX || e.pageY) {
        pos = point(e.pageX, e.pageY);
    } 
    else {
	pos = point(e.clientX + 
		    (document.documentElement.scrollLeft || 
		     document.body.scrollLeft) - 
		    document.documentElement.clientLeft,
		    e.clientY + 
		    (document.documentElement.scrollTop || 
		     document.body.scrollTop) - 
		    document.documentElement.clientTop);
    }
    var rp = Joint.findPos(r.canvas);
    return point(pos.x - rp.x, pos.y - rp.y);
};


/**
 * Engine.
 */
function JointEngine(){ 
    QHsm.apply(this, ["Initial"]);
}

JointEngine.prototype = new QHsm();
JointEngine.prototype.stateInitial = function(e){
    this.joint = null;		// back reference to Joint object

    var self = this;
    this.myIdleHistory = null;	// allows transition to history of Idle state

    /**
     * Slots.
     */

    // temporaries for moving objects
    this._dx = undefined;	
    this._dy = undefined;
    
    // callbacks
    this._callbacks = {
	// called when a joint has just connected to an object
	// the object is accessed using this, 
	// the only argument is what side has been connected ("start" | "end")
	justConnected: function(side){}
    };

    // hack for slow browsers
    //    this._nRedraws = 0;
    //    this._nRedrawsMod = 2;

    // these objects are the ones I can connect to
    this._registeredObjects = [];

    // label related properties
    this._labelString = "";	// label string
    this._labelBox = null;	// rectangle where labelText is located
    this._labelText = null;	// label that keeps its position with connection path middle point
    this._labelAttrs = {stroke: "white", fill: "white"};
    
    this._con = null;		// holds the joint path
    this._conVertices = [];	// joint path vertices
    this._conVerticesCurrentIndex = 0;
    this._nearbyVertexSqrDist = 500;	// Math.sqrt(this._nearbyVertexSqrDist) is tolerable distance of vertex moving
    this._startCap = null;	// start glyph (arrow)
    this._endCap = null;	// end glyph (arrow)

    // connection from start to end
    this._start = { // start object
	joints: [],		// Joints
	curEngine: null,	// currently used engine (when wired)
	shape: null,		// Raphael object
	dummy: false		// is it a dummy object?
    };		
    this._end = { // end object
	joints: [],		// Joints
	curEngine: null,	// currently used engine (when wired)
	shape: null,		// Raphael object
	dummy: false		// is it a dummy object?
    };		

    // _con path options
    this._opt = {
	attrs: {
	    "stroke": "#000",
	    //	    "fill": "#fff",	// can not be used if connection wiring is enabled
	    "fill-opacity": 0.0,
	    "stroke-width": 1,
	    "stroke-dasharray": "-",
	    "stroke-linecap": "round", // butt/square/round/mitter
	    "stroke-linejoin": "round", // butt/square/round/mitter
	    "stroke-miterlimit": 1,
	    "stroke-opacity": 1.0
	},
	cursor: "move",	// CSS cursor property
	beSmooth: false,// be a smooth line? (bezier curve aproximation)
	label: false,	// enabled/disabled connection label
	// bounding box correction 
	// (useful when the connection should start in the center of an object, etc...)
	bboxCorrection: {
	    start: { type: null, x: 0, y: 0, width: 0, height: 0 },
	    end: { type: null, x: 0, y: 0, width: 0, height: 0 }
	},
	// dummy nodes radius and SVG attributes
	dummy: {
	    start: {
		radius: 10,
		attrs: {"opacity": 1.0, "fill": "red"}
	    },
	    end: {
		radius: 5,
		attrs: {"opacity": 1.0, "fill": "yellow"}
	    }
	}
    };

    // get an arrow object
    this._getArrow = function(type, size, attrs){
	var arrow = this._arrows[type](size);
	if (attrs){
	    for (var key in attrs){
		arrow.attrs[key] = attrs[key];
	    }
	}
	return arrow;
    };

    // various ready-to-use arrows + possibility to install user defined arrows
    this._arrows = {
	basic: function(size){
	    return {
		path: ["M","2","0","L","-2","0"],
		dx: 2, dy: 2, // x, y correction
		attrs: self._opt.attrs
	    };
	},
	basicArrow: function(size){
	    if (!size){
		size = 5;	// default
	    }
	    return {
		path: ["M",size.toString(),"0",
		       "L",(-size).toString(),(-size).toString(),
		       "L",(-size).toString(),size.toString(),"z"], 
		dx: size, 
		dy: size, 
		attrs: { stroke: "black", fill: "black" }
	    };
	},
	hand: function(size){
	    return {
		path: ["M","-15.681352","-5.1927657","C","-15.208304","-5.2925912","-14.311293","-5.5561164","-13.687993","-5.7783788","C","-13.06469","-6.0006406","-12.343434","-6.2537623","-12.085196","-6.3408738","C","-10.972026","-6.7163768","-7.6682017","-8.1305627","-5.9385615","-8.9719142","C","-4.9071402","-9.4736293","-3.9010109","-9.8815423","-3.7027167","-9.8783923","C","-3.5044204","-9.8752373","-2.6780248","-9.5023173","-1.8662751","-9.0496708","C","-0.49317056","-8.2840047","-0.31169266","-8.2208528","0.73932854","-8.142924","L","1.8690327","-8.0591623","L","2.039166","-7.4474021","C","2.1327395","-7.1109323","2.1514594","-6.8205328","2.0807586","-6.8020721","C","2.010064","-6.783614","1.3825264","-6.7940997","0.68622374","-6.8253794","C","-0.66190616","-6.8859445","-1.1814444","-6.8071497","-1.0407498","-6.5634547","C","-0.99301966","-6.4807831","-0.58251196","-6.4431792","-0.12850911","-6.4798929","C","1.2241412","-6.5892761","4.7877672","-6.1187783","8.420785","-5.3511477","C","14.547755","-4.056566","16.233479","-2.9820024","15.666933","-0.73209438","C","15.450654","0.12678873","14.920327","0.61899573","14.057658","0.76150753","C","13.507869","0.85232533","12.818867","0.71394493","9.8149232","-0.090643373","C","7.4172698","-0.73284018","6.1067424","-1.0191399","5.8609814","-0.95442248","C","5.6587992","-0.90118658","4.8309652","-0.89582008","4.0213424","-0.94250688","C","3.0856752","-0.99645868","2.5291546","-0.95219288","2.4940055","-0.82101488","C","2.4635907","-0.70750508","2.4568664","-0.61069078","2.4790596","-0.60585818","C","2.5012534","-0.60103228","2.9422761","-0.59725718","3.4591019","-0.59747878","C","3.9759261","-0.59770008","4.4500472","-0.58505968","4.512693","-0.56939128","C","4.7453841","-0.51117988","4.6195024","0.92436343","4.318067","1.650062","C","3.8772746","2.7112738","2.9836566","3.9064107","2.2797382","4.3761637","C","1.5987482","4.8306065","1.52359","4.9484512","1.8576616","5.0379653","C","1.9860795","5.0723748","2.2155555","4.9678227","2.3676284","4.8056312","C","2.6253563","4.5307504","2.6497332","4.5328675","2.7268401","4.8368824","C","2.8605098","5.3638848","2.3264901","6.4808604","1.6782299","7.0301956","C","1.3498639","7.30845","0.75844624","8.0404548","0.36396655","8.6568609","C","-0.58027706","10.132325","-0.69217806","10.238528","-1.4487256","10.377186","C","-2.2048498","10.515767","-4.6836995","9.9021604","-6.41268","9.1484214","C","-9.9464649","7.6078865","-10.697587","7.3186028","-12.142194","6.9417312","C","-13.020384","6.712621","-14.184145","6.4654454","-14.72833","6.3924328","C","-15.272516","6.3194263","-15.731691","6.241583","-15.748724","6.2194535","C","-15.813855","6.1348086","-16.609132","-4.7586323","-16.562804","-4.9315285","C","-16.551052","-4.9753876","-16.154402","-5.0929474","-15.681351","-5.192769","L","-15.681352","-5.1927657","z","M","11.288619","-1.446424","L","10.957631","-0.2111606","L","11.627189","-0.031753373","C","13.374637","0.43647423","14.580622","0.18262123","15.042031","-0.75056578","C","15.503958","-1.6847955","14.648263","-2.6070187","12.514834","-3.4742549","L","11.634779","-3.8320046","L","11.627191","-3.2568392","C","11.623019","-2.9405087","11.470661","-2.1258178","11.288619","-1.446424","z"],
		dx: 17, dy: 17,
		attrs: {}
	    };
	},
	flower: function(size){
	    return {
		path: ["M","14.407634","0.14101164","C","13.49394","-0.67828198","12.640683","-1.3981484","11.695412","-1.9684748","C","9.0580339","-3.5615387","6.1975385","-4.0965167","3.8809003","-3.2050972","C","-1.0202735","-1.4355585","-2.2650956","-0.75266958","-6.1678175","-0.75266958","L","-6.1678175","-2.0100414","C","-1.8745566","-2.0888183","1.0024122","-3.7090503","1.8649218","-6.1147565","C","2.2734082","-7.1733737","2.0690534","-8.5444386","0.7737959","-9.8037723","C","-0.82956951","-11.36162","-5.2455289","-11.821547","-6.0950803","-7.2474282","C","-5.3751604","-7.7316963","-3.8041596","-7.6860056","-3.2477662","-6.7174716","C","-2.8775009","-5.9772878","-3.0228781","-5.1443269","-3.3412911","-4.7534348","C","-3.7218578","-4.1236184","-4.935379","-3.5168459","-6.1678175","-3.5168459","L","-6.1678175","-5.6886834","L","-8.5890734","-5.6886834","L","-8.5890734","-1.1787104","C","-9.8368017","-1.2379009","-10.838424","-1.918296","-11.394817","-3.1843135","C","-11.92063","-3.0214395","-12.984452","-2.2582108","-12.911997","-1.2099015","C","-14.045721","-1.0028338","-14.687381","-0.80225028","-15.717737","0.14101164","C","-14.687714","1.0836088","-14.046053","1.2744822","-12.911997","1.4815506","C","-12.984786","2.5298263","-11.92063","3.2930879","-11.394817","3.4559626","C","-10.838424","2.1902771","-9.8368017","1.5095164","-8.5890734","1.4503588","L","-8.5890734","5.9603315","L","-6.1678175","5.9603315","L","-6.1678175","3.788495","C","-4.935379","3.788495","-3.7218578","4.3958989","-3.3412911","5.0250837","C","-3.0228781","5.4159757","-2.8775009","6.2482381","-3.2477662","6.9891209","C","-3.8041596","7.9569902","-5.3751604","8.003345","-6.0950803","7.5190778","C","-5.2455353","12.093197","-0.82956631","11.643978","0.7737959","10.08583","C","2.0693864","8.827128","2.2734082","7.4453226","1.8649218","6.3864056","C","1.00208","3.980998","-1.8745566","2.3705098","-6.1678175","2.2920986","L","-6.1678175","1.0243179","C","-2.2650956","1.0243179","-1.0206064","1.7065088","3.8809003","3.4767455","C","6.1975385","4.367168","9.0580339","3.8331873","11.695412","2.2401238","C","12.640683","1.669431","13.493608","0.95964074","14.407634","0.14101164","z"],
		dx: 15, dy: 15,
		attrs: {}
	    };
	},
	basicRect: function(size){
	    return {
		path: ["M","15","5","L","-15","5","L","-15","-5", "L", "15", "-5", "z"],
		dx: 15, dy: 15,
		attrs: { stroke: "black", "stroke-width": 1.0 }
	    };
	},
	aggregationArrow: function(size){
	    return {
		path: ["M","7","0","L","0","5","L","-7","0", "L", "0", "-5", "z"],
		dx: 9, dy: 9,
		attrs: { stroke: "black", "stroke-width": 2.0, fill: "black" }
	    };
	}
    };

    // used arrows (default values)
    this._opt.arrow = {
	start: self._getArrow("basic"),
	end: self._getArrow("basicArrow", 5)
    };

    // initial state of the engine
    return this.newInitialState("Idle");
};

/*************************************************************
 * Engine states. (engine behaviour is managed by StateChart)
 *************************************************************/

JointEngine.prototype.stateGeneric = function(e){
    switch (e.type){
    case "entry": return null;
    case "exit": return null;
    case "init": 
	return this.newInitialState("Idle");
    }
    return this.top();
};

JointEngine.prototype.stateIdle = function(e){
    switch (e.type){
    case "entry": return null;
    case "exit": 
	this.myIdleHistory = this.getState();	// save the most recently active state
	return null;	
    case "init":
	return this.newInitialState("Disconnected");
    case "startPositionChanged":
	return this.newState("StartObjectMoving");
    case "endPositionChanged":
	return this.newState("EndObjectMoving");
    case "capMouseDown":
	var 
	eArgs = e.args,
	cap = eArgs.cap;
	this._dx = eArgs.jsEvt.clientX;
	this._dy = eArgs.jsEvt.clientY;

	if (cap === this.startCap()){
	    //	    this.clean().dummyStart();
	    if (!this._start.dummy){
		this.draw().dummyStart();
	    }
	    return this.newState("StartCapDragging");
	} else {
	    //	    this.clean().dummyEnd();
	    if (!this._end.dummy){
		this.draw().dummyEnd();
	    }
	    return this.newState("EndCapDragging");
	}
	return null;
    case "connectionMouseDown":
	var mousePos = Joint.getMousePosition(e.args.jsEvt, this.joint.raphael);

	// if the mouse position is nearby a connection vertex
	// do not create a new one but move the selected one instead
	for (var i = 0, len = this._conVertices.length; i < len; i++){
	    var v = this._conVertices[i];
	    if (line(v, mousePos).squaredLength() < this._nearbyVertexSqrDist){
		this._conVerticesCurrentIndex = i;
		return this.newState("ConnectionWiring");
	    }
	}

	// new vertices can be added CORRECTLY only at the end
	// or at the start of the connection
	// -> TODO 
	var 
	sbbCenter = rect(this.startObject().shape.getBBox()).center(),
	ebbCenter = rect(this.endObject().shape.getBBox()).center(),
	// squared lengths of the lines from the center of 
	// start/end object bbox to the mouse position
	smLineSqrLen = line(sbbCenter, mousePos).squaredLength(),
	emLineSqrLen = line(ebbCenter, mousePos).squaredLength();
	if (smLineSqrLen < emLineSqrLen){
	    // new vertex is added to the beginning of the vertex array
	    this._conVerticesCurrentIndex = 0;
	    this._conVertices.unshift(mousePos);
	} else {
	    // new vertex is added to the end of the vertex array
	    this._conVerticesCurrentIndex = this._conVertices.push(mousePos) - 1;
	}
	return this.newState("ConnectionWiring");
    case "connectionDblClick":
	this.joint.straighten();
	return null;
    }
    return this.state("Generic");
};

JointEngine.prototype.stateDisconnected = function(e){
    switch (e.type){
    case "entry": return null;
    case "exit": return null;	
    case "connect":
	return this.newState("Connected");
    case "connectStartCap":
	return this.newState("StartCapConnected");
    case "connectEndCap":
	return this.newState("EndCapConnected");
    }
    return this.state("Idle");
};

JointEngine.prototype.stateConnected = function(e){
    switch (e.type){
    case "entry": 
	this.redraw();
	this.listenAll();
	return null;
    case "exit": return null;	
    }
    return this.state("Idle");
};

JointEngine.prototype.stateStartCapConnected = function(e){
    switch (e.type){
    case "entry": 
	this.redraw();
	this.listenAll();
	return null;
    case "exit": return null;
    }
    return this.state("Idle");
};

JointEngine.prototype.stateEndCapConnected = function(e){
    switch (e.type){
    case "entry": 
	this.redraw();
	this.listenAll();
	return null;
    case "exit": return null;
    }
    return this.state("Idle");
};
//end of Idle (composite state)

JointEngine.prototype.stateCapDragging = function(e){
    switch (e.type){
    case "entry": return null;
    case "exit": return null;	
    }	
    return this.state("Generic");
};

JointEngine.prototype.stateStartCapDragging = function(e){
    switch (e.type){
    case "entry": return null;
    case "exit": return null;	
    case "mouseMove":
	var jsEvt = e.args.jsEvt;
	// move dummy object
	this.startObject().shape.translate(jsEvt.clientX - this._dx,
					   jsEvt.clientY - this._dy);
	this._dx = jsEvt.clientX;
	this._dy = jsEvt.clientY;
	
	this.redraw();
	this.listenAll();
	return null;
    case "mouseUp":
	var 
	ec = this.endCapConnected(),
	dummy = this.startObject(),
	dummyBB = dummy.shape.getBBox(),
	o = this.objectContainingPoint(point(dummyBB.x, dummyBB.y));
	
	if (o === null || o.cap === "end"){
	    if (ec){
		return this.newState("EndCapConnected");
	    } else {
		return this.newState("Disconnected");
	    }
	} else {
	    this.callback("justConnected", o.target, ["start"]);
	    dummy.shape.remove();	// remove old dummy shape
	    dummy.dummy = false;	// it is no longer dummy
	    dummy.shape = o.target;	// instead it is the new object

	    // push the Joint object into o.joints array
	    // but only if o.joints already doesn't have that Joint object
	    if (o.target.joints.indexOf(this.joint) == -1){
		o.target.joints.push(this.joint);
	    }

	    // make a transition
	    if (ec){
		return this.newState("Connected");
	    } else {
		return this.newState("StartCapConnected");
	    }
	}
	return null;
    }	
    return this.state("CapDragging");
};

JointEngine.prototype.stateEndCapDragging = function(e){
    switch (e.type){
    case "entry": return null;
    case "exit": return null;	
    case "mouseMove":
	var jsEvt = e.args.jsEvt;
	// move dummy object
	this.endObject().shape.translate(jsEvt.clientX - this._dx,
					 jsEvt.clientY - this._dy);
	this._dx = jsEvt.clientX;
	this._dy = jsEvt.clientY;

	this.redraw();
	this.listenAll();
	return null;
    case "mouseUp":
	var 
	sc = this.startCapConnected(),
	dummy = this.endObject(),
	dummyBB = dummy.shape.getBBox(),
	o = this.objectContainingPoint(point(dummyBB.x, dummyBB.y));
	
	if (o === null || o.cap === "start"){
	    if (sc){
		return this.newState("StartCapConnected");
	    } else {
		return this.newState("Disconnected");
	    }
	} else {
	    this.callback("justConnected", o.target, ["end"]);
	    dummy.shape.remove();	// remove old dummy shape
	    dummy.dummy = false;	// it is no longer dummy
	    dummy.shape = o.target;	// instead it is the new object

	    // push the Joint object into o.joints array
	    // but only if o.joints already doesn't have that Joint object
	    if (o.target.joints.indexOf(this.joint) == -1){
		o.target.joints.push(this.joint);
	    }

	    // make a transition
	    if (sc){
		return this.newState("Connected");
	    } else {
		return this.newState("EndCapConnected");
	    }
	}
	return null;
    }	
    return this.state("CapDragging");
};
// end of CapDragging

JointEngine.prototype.stateObjectMoving = function(e){
    switch (e.type){
    case "entry": return null;
    case "exit": return null;
    case "mouseUp":
    case "done":
	return this.newState(this.myIdleHistory);	// transition to history of Idle
    }
    return this.state("Generic");
};

JointEngine.prototype.stateStartObjectMoving = function(e){
    switch (e.type){
    case "entry": 
//	console.log("StartObjectMoving");
//	this.redraw();
//	this.clean().connection().endCap().label();
//	this.draw().connection().transStartCap().endCap().label();

//	this.listenAll();
	return null;
    case "exit": return null;
    }
    return this.state("ObjectMoving");
};

JointEngine.prototype.stateEndObjectMoving = function(e){
    switch (e.type){
    case "entry": 
//	this.redraw();
//	this.listenAll();
	return null;
    case "exit": return null;
    }
    return this.state("ObjectMoving");
};
// end of ObjectMoving

JointEngine.prototype.stateConnectionWiring = function(e){
    switch (e.type){
    case "entry": 
	this.redraw();
	this.listenAll();
	return null;
    case "exit": return null;
    case "mouseMove":
	this._conVertices[this._conVerticesCurrentIndex] = Joint.getMousePosition(e.args.jsEvt, this.joint.raphael);
	this.redraw();
	this.listenAll();
	return null;
    case "mouseUp":
	return this.newState(this.myIdleHistory);
    }
    return this.state("Generic");
};// end of ConnectionWiring

/**
 * Getters.
 */
JointEngine.prototype.connection = function(){ return this._con; };
JointEngine.prototype.endObject = function(){ return this._end; };
JointEngine.prototype.startObject = function(){ return this._start; };
JointEngine.prototype.endCap = function(){ return this._endCap; };
JointEngine.prototype.endCapConnected = function(){ return !this._end.dummy; };
JointEngine.prototype.startCap = function(){ return this._startCap; };
JointEngine.prototype.startCapConnected = function(){ return !this._start.dummy; };
JointEngine.prototype.joint = function(){ return this.joint; };

/**
 * Helpers.
 */
JointEngine.prototype.callback = function(fnc, scope, args){
    this._callbacks[fnc].apply(scope, args);
};

/**
 * Search the registered objects and get the one (if any)
 * who's bounding box contains the point p.
 */
JointEngine.prototype.objectContainingPoint = function(p){
    for (var i = this._registeredObjects.length - 1; i >= 0; --i){
	var o = this._registeredObjects[i];
	if (rect(o.target.getBBox()).containsPoint(p)){
	    return o;
	}
    }
    return null;
};

/**
 * Remove reference to Joint from obj.
 * obj is either startObect or EndObject
 */
JointEngine.prototype.freeJoint = function(obj){
    var 
    jar = obj.shape.joints,	// joints array
    i = jar.indexOf(this.joint);
    jar.splice(i, 1);
    if (jar.length === 0){
	delete obj.shape.joints;
    }
};

/**************************************************
 * Event dispatching.
 **************************************************/

JointEngine.prototype.listenOnMouseDown = function(obj){
    var self = this;
    // register mousedown event callback
    if (obj === this.connection()){	// on connection
	addEvent(obj.node, "mousedown", function(e){ 
	    self.connectionMouseDown(e); 
	    e.stopPropagation();	// prevent bubbling
	    e.preventDefault();		// prevent browser's default action
	});
    } else {	// on cap
	addEvent(obj.node, "mousedown", function(e){ 
	    self.capMouseDown(e, obj);
	    e.stopPropagation();	// prevent bubbling
	    e.preventDefault();		// prevent browser's default action
	});
    }
    // TODO: remove event when not needed 
};

JointEngine.prototype.listenOnDblClick = function(obj){
    var self = this;
    // register dblclick event callback
    if (obj === this.connection()){
	addEvent(obj.node, "dblclick", function(e){ 
	    self.connectionDblClick(e); 
	    e.stopPropagation();	// prevent bubbling
	    e.preventDefault();		// prevent browser's default action
	});
    }
    // TODO: remove event when not needed 
};

// reference to current engine when an object is dragging
// can be global across all raphael 'worlds' because only one object can be dragged at a time
Joint.currentEngine = null;

/**
 * MouseDown event callback when on cap.
 */
JointEngine.prototype.capMouseDown = function(e, cap){
    Joint.currentEngine = this;	// keep global reference to me
    this.dispatch(qevt("capMouseDown", {"cap": cap, jsEvt: e}));
};

/**
 * MouseDown event callback when on connection.
 */
JointEngine.prototype.connectionMouseDown = function(e){
    Joint.currentEngine = this;	// keep global reference to me
    this.dispatch(qevt("connectionMouseDown", {jsEvt: e}));
};

/**
 * DblClick event callback when on connection.
 */
JointEngine.prototype.connectionDblClick = function(e){
    this.dispatch(qevt("connectionDblClick", {jsEvt: e}));
};

/**
 * MouseMove event callback.
 */
Joint.mouseMove = function(e){
    if (Joint.currentEngine !== null){
	Joint.currentEngine.dispatch(qevt("mouseMove", {jsEvt: e}));
    }
};

/**
 * MouseUp event callback.
 */
Joint.mouseUp = function(e){
    if (Joint.currentEngine !== null){
	Joint.currentEngine.dispatch(qevt("mouseUp"));
    }
    Joint.currentEngine = null;
};

/**
 * @todo register handlers only if draggable caps
 * are allowed in options. Applications may not need it.
 */
addEvent(document, "mousemove", Joint.mouseMove);
addEvent(document, "mouseup", Joint.mouseUp);


/**
 * Primitive draw functions.
 */
function GPrimitives(raphael){
    this.raphael = raphael;
}

GPrimitives.prototype = {
    constructor: GPrimitives,

    line: function(start, end, attrs){ 
	return this.raphael.path(["M", start.x, start.y, "L", end.x, end.y].join(" ")).attr(attrs); 
    },
    path: function(commands, attrs){ 
	return this.raphael.path(commands.join(" ")).attr(attrs); 
    },
    circle: function(pos, radius, attrs){ 
	return this.raphael.circle(pos.x, pos.y, radius).attr(attrs); 
    },
    rect: function(pos, width, height, attrs){ 
	return this.raphael.rect(pos.x, pos.y, width, height).attr(attrs); 
    },
    text: function(pos, str){ 
	return this.raphael.text(pos.x, pos.y, str); 
    }
};

/**
 * Computes all the neccessary variables for drawing a connection.
 * Singleton.
 * @todo implement Memento object.
 */
function ConstraintSolver(){}

ConstraintSolver.prototype = {
    constructor: ConstraintSolver,

    _startShapeBBox: null,
    _endShapeBBox: null,
    _startShapeType: null,
    _endShapeType: null,    
    _conVertices: [],
    _arrowStartShift: {dx: 0, dy: 0},
    _arrowEndShift: {dx: 0, dy: 0},
    _bboxCorrection: {
	start: { type: null, x: 0, y: 0, width: 0, height: 0 },
	end: { type: null, x: 0, y: 0, width: 0, height: 0 }
    },
    _flags: {
	smooth: false,
	label: false
    },
    _state: {
	/*
	  sBoundPoint: undefined,
	  eBoundPoint: undefined,
	  conPathCommands: undefined,
	  labelPoint: undefined,
	  sTheta: undefined,
	  eTheta: undefined
	*/
    },
    _aux: {
	/*
	  sbb: undefined,
	  ebb: undefined,
	  sbbCenter: undefined,
	  ebbCenter: undefined,
	  sPoint: undefined,
	  ePoint: undefined
	*/
    },
    /*    
	  toString: function(){
	  var str = 
	  "sBoundPoint: " + this._state.sBoundPoint.toString() + "\n" +
	  "eBoundPoint: " + this._state.eBoundPoint.toString() + "\n" +
	  "conPathCommands: " + this._state.conPathCommands.toString() + "\n" +
	  "labelPoint: " + this._state.labelPoint.toString() + "\n" +
	  "sTheta: " + this._state.sTheta.toString() + "\n" +
	  "eTheta: " + this._state.eTheta.toString() + "\n";
	  return str;
	  },
    */
    setStartShapeBBox: function(bb){ this._startShapeBBox = bb; },
    setEndShapeBBox: function(bb){ this._endShapeBBox = bb; },
    setStartShapeType: function(type){ this._startShapeType = type; },
    setEndShapeType: function(type){ this._endShapeType = type; },
    setConVertices: function(vertices){	this._conVertices = vertices; },
    setArrowStartShift: function(shift){ this._arrowStartShift = shift; },
    setArrowEndShift: function(shift){ this._arrowEndShift = shift; },    
    setBBoxCorrection: function(cor){ this._bboxCorrection = cor; },
    setSmooth: function(trueFalse){ this._flags.smooth = trueFalse; },
    setLabel: function(trueFalse){ this._flags.label = true; },

    /**
     * Get state of csolver. Useful for possible undo operations.
     * @see Command design pattern.
     * @todo get a deep copy of the state.
     */    
    getMemento: function(){
	return this._state;
    },

    /**
     * Invalidate csolver, i.e. each variable will be computed again.
     */
    invalidate: function(){
	this._state = {};
	this._aux = {};
    },

    /**
     * Find point on an object of type 'type' with bounding box 'r' where line starting
     * from r's center ending in point 'p' intersects the object.
     */
    boundPoint: function(r, type, p){
	var rCenter = r.center();
	if (type === "circle" || 
	    type === "ellipse"){
	    return ellipse(rCenter, r.width/2, r.height/2).intersectionWithLineFromCenterToPoint(p);
	}
	// BUG: in lines intersection, can be all null
	// it happens when point is located on the bb boundary
	return r.boundPoint(p) || rCenter;
    },
    
    /**
     * intersection of a line leading from __sbbCenter to __ebbCenter 
     * (or first connection vertex) and the start object boundary
     */
    sBoundPoint: function(){
	if (this._state.sBoundPoint){
	    return this._state.sBoundPoint;
	}
	var from;
	if (this._conVertices.length > 0){
	    from = this._conVertices[0];
	} else {
	    from = this.ebbCenter();
	}
	return this.boundPoint(this.sbb(), this._bboxCorrection.start.type || this._startShapeType, from);
    },

    /** 
     * intersection of a line leading from __ebbCenter to __sbbCenter 
     * (or last connection vertex) and the end object boundary
     */
    eBoundPoint: function(){
	if (this._state.eBoundPoint){
	    return this._state.eBoundPoint;
	}
	var from;
	if (this._conVertices.length > 0){
	    from = this._conVertices[this._conVertices.length - 1];
	} else {
	    from = this.sbbCenter();
	}
	this._state.eBoundPoint = this.boundPoint(this.ebb(), this._bboxCorrection.end.type || this._endShapeType, from);
	return this._state.eBoundPoint;
    },

    /**
     * angle between __sbbCenter and __ebbCenter (or first connection vertex)	
     */
    sTheta: function(){
	if (this._state.sTheta){
	    return this._state.sTheta;
	}
	var to;
	if (this._conVertices.length > 0){
	    to = this._conVertices[0];
	} else {
	    to = this.ebbCenter();
	}
	this._state.sTheta = this.sbbCenter().theta(to);
	return this._state.sTheta;
    },

    /**
     * angle between __ebbCenter and __sbbCenter (or last connection vertex)
     */
    eTheta: function(){
	if (this._state.eTheta){
	    return this._state.eTheta;
	}
	var from;
	if (this._conVertices.length > 0){
	    from = this._conVertices[this._conVertices.length - 1];
	} else {
	    from = this.sbbCenter();
	}
	this._state.eTheta = from.theta(this.ebbCenter());
	return this._state.eTheta;
    },

    /**
     * connection path commands
     */
    conPathCommands: function(){
	if (this._state.conPathCommands){
	    return this._state.conPathCommands;
	}
	var
	sPoint = this.sPoint(),
	ePoint = this.ePoint(),
	state = this._state;

	if (this._flags.smooth){
	    state.conPathCommands = Bezier.curveThroughPoints([point(sPoint.x, sPoint.y)].concat(this._conVertices, [point(ePoint.x, ePoint.y)]));
	} else {
	    state.conPathCommands = ["M", sPoint.x, sPoint.y];
	    for (var i = 0, len = this._conVertices.length; i < len; i++){
		state.conPathCommands.push("L");
		state.conPathCommands.push(this._conVertices[i].x);
		state.conPathCommands.push(this._conVertices[i].y);
	    }
	    state.conPathCommands.push("L");	
	    state.conPathCommands.push(ePoint.x);
	    state.conPathCommands.push(ePoint.y);
	}
	return state.conPathCommands;
    },
    
    /**
     * label position
     */
    labelPoint: function(){
	var state = this._state;

	if (state.labelPoint){
	    return state.labelPoint;
	}
	var 
	sPoint = this.sPoint(),
	ePoint = this.ePoint();

	state.labelPoint = sPoint;
	for (var i = 0, len = this._conVertices.length; i < len; i++){
	    state.labelPoint = line(state.labelPoint, this._conVertices[i]).midpoint();
	}
	state.labelPoint = line(state.labelPoint, ePoint).midpoint();
	return state.labelPoint;
    },

    /**
     * start object bounding box
     */
    sbb: function(){
	var aux = this._aux;

	if (aux.sbb){
	    return aux.sbb;
	}
	aux.sbb = rect(this._startShapeBBox).moveAndExpand(this._bboxCorrection.start);
	return aux.sbb;
    },

    /**
     * start object bounding box center point
     */
    sbbCenter: function(){
	var aux = this._aux;

	if (aux.sbbCenter){
	    return aux.sbbCenter;
	}
	aux.sbbCenter = this.sbb().center();
	return aux.sbbCenter;
    },

    /**
     * end object bounding box
     */
    ebb: function(){
	var aux = this._aux;

	if (aux.ebb){
	    return aux.ebb;
	}
	aux.ebb = rect(this._endShapeBBox).moveAndExpand(this._bboxCorrection.end);
	return aux.ebb;
    },

    /**
     * end object bounding box center point
     */
    ebbCenter: function(){
	var aux = this._aux;

	if (aux.ebbCenter){
	    return aux.ebbCenter;
	}
	aux.ebbCenter = this.ebb().center();
	return aux.ebbCenter;
    },

    /**
     * __sBoundPoint moved in the direction of __eBoundPoint (or first connection vertex) 
     * by start cap width
     */
    sPoint: function(){
	var aux = this._aux;

	if (aux.sPoint){
	    return aux.sPoint;
	}
	var 
	sBoundPoint = this.sBoundPoint(),
	sTheta = this.sTheta(),
	arrowStartShift = this._arrowStartShift;
	
	aux.sPoint = point(
	    sBoundPoint.x + (2 * arrowStartShift.dx * Math.cos(sTheta.radians)),
	    sBoundPoint.y + (-2 * arrowStartShift.dy * Math.sin(sTheta.radians))
	);
	return aux.sPoint;
    },

    /**
     * __eBoundPoint moved in the direction of __sBoundPoint (or last connection vertex) 
     * by end cap width
     */
    ePoint: function(){
	var aux = this._aux;

	if (aux.ePoint){
	    return aux.ePoint;
	}
	var 
	eBoundPoint = this.eBoundPoint(),
	eTheta = this.eTheta(),
	arrowEndShift = this._arrowEndShift;
	
	aux.ePoint = point(
	    eBoundPoint.x + (-2 * arrowEndShift.dx * Math.cos(eTheta.radians)),
	    eBoundPoint.y + (2 * arrowEndShift.dy * Math.sin(eTheta.radians))
	);
	return aux.ePoint;
    }
};

/**************************************************
 * Engine draw/clean methods.
 **************************************************/

JointEngine.prototype.redraw = function(){
    this.clean().connection().startCap().endCap().label();
    this.draw().connection().startCap().endCap().label();
};

JointEngine.prototype.listenAll = function(){
    this.listenOnMouseDown(this.startCap());
    this.listenOnMouseDown(this.endCap());
    this.listenOnMouseDown(this.connection());
    this.listenOnDblClick(this.connection());
};

/**
 * This is the beginning of every drawing.
 * Prepares parameters for drawing objects.
 * Defines primitives for drawing.
 * Draw functions (not primitives) store the resulting DOM element 
 * into self._con, self._startCap, self._endCap, self._labelText and self._labelBox respectively.
 * Draw functions support chaining.
 *
 * TODO: for better performance, get primitives out of draw() method, otherwise
 * they will be created each time draw() method is called.
 */
JointEngine.prototype.draw = function(){
    var 
    self = this,
    csolver = this.joint.csolver,
    gprimitives = this.joint.gprimitives;

    // set contraint solver
    this.joint.setConstraintSolver(csolver);
    // invalidate contraint solver
    // @todo invalidation must be done elsewhere
    // and must invalidate only specific variables
    csolver.invalidate();

    return {
	dummyStart: function(){
	    var 
	    start = self._start,
	    opt = self._opt.dummy.start;

	    start.dummy = true;
	    start.shape = gprimitives.circle(csolver.sBoundPoint(), opt.radius, opt.attrs);
	    start.shape.show();
	    return this;
	},
	dummyEnd: function(){
	    var 
	    end = self._end,
	    opt = self._opt.dummy.end;

	    end.dummy = true;
	    end.shape = gprimitives.circle(csolver.eBoundPoint(), opt.radius, opt.attrs);
	    end.shape.show();
	    return this;
	},
	connection: function(){
	    var opt = self._opt;

	    //	    self._con = gprimitives.line(__.sPoint, __.ePoint, self._opt.attrs);
	    self._con = gprimitives.path(csolver.conPathCommands(), opt.attrs);
	    var con = self._con;
	    con.node.style.cursor = opt.cursor;	
	    //	   self._con.toBack();
	    con.show();
	    return this;
	},
	label: function(){
	    if (!self._opt.label){ 
		return this; 
	    }
	    self._labelText = gprimitives.text(csolver.labelPoint(), self._labelString);
	    var bb = self._labelText.getBBox();
	    self._labelBox = gprimitives.rect(bb, bb.width, bb.height, self._labelAttrs);
	    self._labelText.insertAfter(self._labelBox);
	    return this;
	},
	transStartCap: function(){
	    var 
	    opt = self._opt.arrow.start,
	    sBoundPoint = csolver.sBoundPoint(),
	    sTheta = csolver.sTheta();

//	    self._startCap = gprimitives.path(opt.path, opt.attrs);
	    var startCap = self._startCap;
	    var tr = startCap.attr("translation");
	    startCap.translate(-tr.x + sBoundPoint.x + (opt.dx * Math.cos(sTheta.radians)), 
			       -tr.y + sBoundPoint.y - (opt.dy * Math.sin(sTheta.radians)));
	    startCap.rotate(360 - (sTheta.degrees) + 180);
//	    startCap.show();
	    return this;
	},
	startCap: function(){
	    var 
	    opt = self._opt.arrow.start,
	    sBoundPoint = csolver.sBoundPoint(),
	    sTheta = csolver.sTheta();

	    self._startCap = gprimitives.path(opt.path, opt.attrs);
	    var startCap = self._startCap;
	    startCap.translate(sBoundPoint.x + (opt.dx * Math.cos(sTheta.radians)), 
			       sBoundPoint.y - (opt.dy * Math.sin(sTheta.radians)));
	    startCap.rotate(360 - (sTheta.degrees) + 180);
	    startCap.show();
	    return this;
	},
	endCap: function(){
	    var 
	    opt = self._opt.arrow.end,
	    eBoundPoint = csolver.eBoundPoint(),
	    eTheta = csolver.eTheta();

	    self._endCap = gprimitives.path(opt.path, opt.attrs);
	    var endCap = self._endCap;
	    endCap.translate(eBoundPoint.x - (opt.dx * Math.cos(eTheta.radians)), 
			     eBoundPoint.y + (opt.dy * Math.sin(eTheta.radians)));
	    endCap.rotate(360 - (eTheta.degrees));
	    endCap.show();
	    return this;
	}
    };
};

/**
 * Clean operations. 
 * Remove the DOM elements of connection/startCap/endCap/label if they exist.
 * Clean operations support chaining.
 */
JointEngine.prototype.clean = function(){
    var self = this;
    return {
	connection: function(){ 
	    var con = self._con;
	    if (con){ con.remove(); }
	    return this;
	},
	startCap: function(){
	    var startCap = self._startCap;
	    if (startCap){ startCap.remove(); }
	    return this;
	},
	endCap: function(){ 
	    var endCap = self._endCap;
	    if (endCap){ self._endCap.remove(); }
	    return this;
	},
	label: function(){
	    var 
	    labelBox = self._labelBox,
	    labelText = self._labelText;
	    if (labelBox){ labelBox.remove(); }
	    if (labelText){ labelText.remove(); }
	    return this;
	},
	dummyEnd: function(){
	    var end = self._end;
	    if (end.dummy && end.shape){
		end.shape.remove();
	    }
	    return this;
	},
	dummyStart: function(){
	    var start = self._start;
	    if (start.dummy && start.shape){
		start.shape.remove();
	    }
	    return this;
	}
    };
};

/**************************************************
 * Joint.
 **************************************************/

function Joint(raphael, from, to, opt){ 
    this.raphael = raphael;

    this.engine = new JointEngine().init();
    this.engine.joint = this;

    // primitive draw functions
    this.gprimitives = new GPrimitives(raphael);

    // options
    this.processOptions(opt);

    if (from._isPoint){
	// draw dummy start
	this.engine._start.shape = gprimitives.circle(from, this.engine._opt.dummy.start.radius, this.engine._opt.dummy.start.attrs);
	this.engine._start.dummy = true;
	this.engine._start.shape.show();
    } else {
	this.engine._start.shape = from;
    }
    if (to._isPoint){
	// draw dummy end
	this.engine._end.shape = gprimitives.circle(to, this.engine._opt.dummy.end.radius, this.engine._opt.dummy.end.attrs);
	this.engine._end.dummy = true;
	this.engine._end.shape.show();
    } else {
	this.engine._end.shape = to;	
    }

    // constraint solver
    this.csolver = new ConstraintSolver();
    // has to be set after shapes assignment and option processing
    this.setConstraintSolver(this.csolver);

    // to be able to dispatch events in Raphael element attr method
    // TODO: possible source of memory leaks!!!
    (this.engine._start.shape.joints) ? this.engine._start.shape.joints.push(this) : this.engine._start.shape.joints = [this];
    (this.engine._end.shape.joints) ? this.engine._end.shape.joints.push(this) : this.engine._end.shape.joints = [this];

    // notice the machine
    if (from._isPoint && !to._isPoint){
	this.engine.dispatch(qevt("connectEndCap"));	
    } else if (!from._isPoint && to._isPoint){
	this.engine.dispatch(qevt("connectStartCap"));	
    } else if (!from._isPoint && !to._isPoint){
	this.engine.dispatch(qevt("connect"));	
    } else {
	// else stay disconnected
	this.engine.redraw();
	this.engine.listenAll();
    }
}
window.Joint = Joint;	// the only global variable

Joint.prototype.setConstraintSolver = function(csolver){
    if (this.engine._start.shape){
	this.csolver.setStartShapeBBox(this.engine._start.shape.getBBox());
	this.csolver.setStartShapeType(this.engine._start.shape.type);
    } else {
	this.csolver.setStartShapeBBox({x: 0, y: 0, width: 0, height: 0});
	this.csolver.setStartShapeType("rect");
    }
    if (this.engine._end.shape){
	this.csolver.setEndShapeBBox(this.engine._end.shape.getBBox());
	this.csolver.setEndShapeType(this.engine._end.shape.type);
    } else {
	this.csolver.setEndShapeBBox({x: 0, y: 0, width: 0, height: 0});
	this.csolver.setEndShapeType("rect");
    }

    this.csolver.setConVertices(this.engine._conVertices);
    this.csolver.setArrowStartShift({dx: this.engine._opt.arrow.start.dx, dy: this.engine._opt.arrow.start.dy});
    this.csolver.setArrowEndShift({dx: this.engine._opt.arrow.end.dx, dy: this.engine._opt.arrow.end.dy});
    this.csolver.setBBoxCorrection(this.engine._opt.bboxCorrection);
    this.csolver.setSmooth(this.engine._opt.beSmooth);
    this.csolver.setLabel(this.engine._opt.label);    
};

/**
 * Process options.
 */
Joint.prototype.processOptions = function(opt){
    if (opt && opt.label){
	this.engine._opt.label = true;
	this.engine._labelString = opt.label;
    }

    if (opt && opt.attrs){
	for (var key in opt.attrs){
	    this.engine._opt.attrs[key] = opt.attrs[key];
	}
    }
    if (opt && opt.startArrow){
	if (opt.startArrow.type){
	    this.engine._opt.arrow.start = this.engine._getArrow(opt.startArrow.type, opt.startArrow.size, opt.startArrow.attrs);
	} else { 
	    opt.startArrow.type = "aggregationArrow";
        }
    }
    if (opt && opt.endArrow){
	if (opt.endArrow.type){
	    this.engine._opt.arrow.end = this.engine._getArrow(opt.endArrow.type, opt.endArrow.size, opt.endArrow.attrs);
	} else { 
	    opt.endArrow.type = "basicArrow";
	}
    }
    if (opt && opt.bboxCorrection){
	if (opt.bboxCorrection.start){
	    for (var key in opt.bboxCorrection.start){
		this.engine._opt.bboxCorrection.start[key] = opt.bboxCorrection.start[key];
	    }
	}
	if (opt.bboxCorrection.end){
	    for (var key in opt.bboxCorrection.end){
		this.engine._opt.bboxCorrection.end[key] = opt.bboxCorrection.end[key];
	    }
	}
    }
};

/**
 * TODO: rotation support. there is a problem because
 * rotation does not set any attribute in this.attrs but
 * instead it sets transformation directly to let the browser
 * SVG engine compute the position.
 */
var _attr = Raphael.el.attr;
Raphael.el.attr = function(){
    // is it a getter or el is not a joint object?
    if ((arguments.length == 1 && (typeof arguments[0] === "string" || typeof arguments[0] === "array")) || (typeof this.joints === "undefined")){
	return _attr.apply(this, arguments);	// yes
    }

    // old attributes
    var o = {};
    for (var key in this.attrs){
	o[key] = this.attrs[key];
    }

    _attr.apply(this, arguments);
    
    var n = this.attrs;	// new attributes

    for (var i = this.joints.length - 1; i >= 0; --i){
	var engine = this.joints[i].engine;
	
	if (o.x != n.x || o.y != n.y ||	// rect/image/text
	    o.cx != n.cx || o.cy != n.cy ||	// circle/ellipse
	    o.path != n.path ||	// path
	    o.r != n.r){	// radius

	    if (this === engine.startObject().shape){
		engine.dispatch(qevt("startPositionChanged"));
	    } else {
		engine.dispatch(qevt("endPositionChanged"));
	    }
	    engine.dispatch(qevt("done"));
	}
	
	if (o.stroke != n.stroke){
	    engine.dispatch(qevt("strokeChanged"));
	}
    }

    return this;
};

/**************************************************
 * Public API.
 **************************************************/

/**
 * Register object so that it can be pointed by my cap.
 * @param <obj> raphael object or Shape (or array of raphael objects or Shapes)
 * @param <cap> string "start|end|both" default: "both"
 */
Joint.prototype.register = function(obj, cap){
    if (typeof cap === "undefined"){
	cap = "both";
    }
    // prepare array of objects that are to be registered
    var toRegister = [];
    if (obj.constructor == Array){
	toRegister = obj;
    } else {
	toRegister = [obj];
    }
    // register all objects in toRegister array
    for (var i = 0, len = toRegister.length; i < len; i++){
	if (!toRegister[i].joints){
	    toRegister[i].joints = [];
	}
	this.engine._registeredObjects.push({target: toRegister[i], cap: cap});
    }
    // allow chaining
    return this;
};

/**
 * Cancel registration of an object.
 * @param <obj> raphael object or Shape
 * @param <cap> string "start|end|both" default: "both"
 */
Joint.prototype.unregister = function(obj, cap){
    if (typeof cap === "undefined"){
	cap = "both";
    }
    var index = -1;
    for (var i = 0, len = this.engine._registeredObjects.length; i < len; i++){
	if (this.engine._registeredObjects[i].target === obj && 
	    this.engine._registeredObjects[i].cap === cap){
	    index = i;
	    break;
	}
    }
    if (index !== -1){
	this.engine._registeredObjects.splice(index, 1);
    }
};

/**
 * Set the vertices of the connection
 * @param <vertices> array of points
 */
Joint.prototype.setVertices = function(vertices){
    var engine = this.engine;
    engine._conVertices = vertices;
    engine.redraw();
    engine.listenAll();
    return this;
};

/**
 * @return <array> of connection vertices
 */
Joint.prototype.getVertices = function(){
    return this.engine._conVertices;
};

/**
 * Toggle the connection smoothing (bezier/straight).
 */
Joint.prototype.toggleSmoothing = function(){
    var engine = this.engine;
    engine._opt.beSmooth = !engine._opt.beSmooth;
    engine.redraw();
    engine.listenAll();
    return this;
};

/**
 * Set label.
 */
Joint.prototype.label = function(str){
    var engine = this.engine;
    engine._opt.label = true;
    engine._labelString = str;
    engine.redraw();
    engine.listenAll();
    return this;
};

/**
 * Register callback function on various events.
 * @see this.engine._callbacks
 */
Joint.prototype.registerCallback = function(evt, fnc){
    this.engine._callbacks[evt] = fnc;
    return this;
};

/**
 * Straighten the bent connection path.
 */
Joint.prototype.straighten = function(){
    var engine = this.engine;
    this.engine._con.remove();
    this.raphael.safari();
    engine._conVertices = [];
    engine.redraw();
    engine.listenAll();
    return this;
};

/**************************************************
 * TODO: desrcibe all options.
 * Create a joint between the this and to objects.
 * @param to object Raphael object (rect/ellipse/circle)
 * @param opt object options
 *	possible options:
 * {
 *   attrs: connection options, @see Raphael path options
 *   startArrow: {
 *            type: basic|basicArrow|basicRect|aggregationArrow
 *            attrs: @see Raphael path options
 *   },
 *   endArrow: {
 *            type: basic|basicArrow|basicRect|aggregationArrow
 *            attrs: @see Raphael path options
 *   },
 *   bboxCorrection: {  // correction of bounding box (useful when the connection should start in the center of an object, etc...
 *            start: {
 *                type: ellipse|rect,
 *                x: number,
 *                y: number,
 *                width: number,
 *                height: number
 *            },
 *            end: {
 *                type: ellipse|rect,
 *                x: number,
 *                y: number,
 *                width: number,
 *                height: number
 *            }
 *   }
 * }
 ***************************************************/
Raphael.el.joint = function(to, opt){
    return new Joint(this.paper, this, to, opt);
};

//})();	// END CLOSURE
