window.onload = function(){
    Joint.paper("world", 640, 380);    
};

var
fsa = Joint.dia.fsa,
pn = Joint.dia.pn,
uml = Joint.dia.uml,
devs = Joint.dia.devs,
all = [];

function toggle(id){
    var fieldset = document.getElementById(id);
    var hidden = fieldset.className == "hidden";
    fieldset.className = (hidden) ? "" : "hidden";

    var i = fieldset.childNodes.length - 1;
    while (i-- > 2){
	if (fieldset.childNodes[i].nodeType !== 1){
	    continue;
	}
	fieldset.childNodes[i].style.display = (hidden) ? null : "none";
    }
}

function opt(module, id, value){
    var key = module + "-" + id;
    console.log(key, value);
    var inp = document.getElementById(key);
    if (value !== undefined){	// setter
	inp.value = value;
    }
    var valStr = inp.value;
    var valInt = parseInt(valStr);
    if (!isNaN(valInt)){
	return valInt;	
    }
    return valStr;
}

function attrs(){
    var attrs = {};
    attrs.fill = opt("attrs", "fill");
    attrs.stroke = opt("attrs", "stroke");
    return attrs;
}

function newJoint(module, arrowName){
    if (arrowName === undefined){
	arrowName = "arrow";
    }
    var arrow = Joint.dia[module][arrowName];
    var label = opt(module, "label");
    if (label){
	arrow.label = label;
    }
    Joint({x: 100, y: 100}, {x: 200, y: 200}, arrow).registerForever(all);
}

function toggleGhosting(){
    var l = all.length;
    while (l--){ all[l].toggleGhosting(); }
}

/**
 * FSA.
 */
function newFsaState(){
    var properties = {
	position: {x: opt("fsa", "positionX"), y: opt("fsa", "positionY")},
	label: opt("fsa", "label")
    };
    console.log("FSA State: ", properties);
    all.push(fsa.State.create(properties));
}
function newFsaStartState(){
    var properties = {
	position: {x: opt("fsa", "positionX"), y: opt("fsa", "positionY")}	
    };
    console.log("FSA StartState: ", properties);
    all.push(fsa.StartState.create(properties));  
}
function newFsaEndState(){
    var properties = {
	position: {x: opt("fsa", "positionX"), y: opt("fsa", "positionY")}	
    };
    console.log("FSA EndState: ", properties);
    all.push(fsa.EndState.create(properties));  
}

/**
 * PN.
 */

function newPnPlace(){
    var properties = {
	position: {x: opt("pn", "positionX"), y: opt("pn", "positionY")},
	tokens: opt("pn", "tokens"),
	label: opt("pn", "label"),
	radius: opt("pn", "radius")
    };
    console.log("PN Place: ", properties);
    all.push(pn.Place.create(properties));
}
function newPnEvent(){
    var properties = {
	rect: {x: opt("pn", "rectX"), y: opt("pn", "rectY"), width: opt("pn", "rectWidth"), height: opt("pn", "rectHeight")},
	label: opt("pn", "label")
    };
    console.log("PN Event: ", properties);
    all.push(pn.Event.create(properties));
}

/**
 * UML.
 */

function newUmlClass(){
    var 
    attributes = opt("uml", "attributes"),
    methods = opt("uml", "methods");
    attributes = attributes ? attributes.split(",") : undefined;
    methods = methods ? methods.split(",") : undefined;
    var properties = {
	attrs: attrs(),
	rect: {x: opt("uml", "rectX"), y: opt("uml", "rectY"), width: opt("uml", "rectWidth"), height: opt("uml", "rectHeight")},
	label: opt("uml", "label"),
	attributes: attributes,
	methods: methods
    };
    console.log("UML Class: ", properties);
    all.push(uml.Class.create(properties));
}

function newUmlState(){
    var 
    entry = opt("uml", "entry"),
    exit = opt("uml", "exit"),
    inner = opt("uml", "inner");
    entry = entry ? entry : undefined;
    exit = exit ? exit : undefined;
    inner = inner ? inner.split(",") : undefined;    
    
    var properties = {
	attrs: attrs(),
	rect: {x: opt("uml", "rectX"), y: opt("uml", "rectY"), width: opt("uml", "rectWidth"), height: opt("uml", "rectHeight")},
	label: opt("uml", "label"),
	actions: {
	    entry: entry,
	    exit: exit,
	    inner: inner
	}
    };
    console.log("UML State: ", properties);
    all.push(uml.State.create(properties));
}

function newUmlStartState(){
    var properties = {
	position: {x: opt("uml", "positionX"), y: opt("uml", "positionY")}	
    };
    console.log("UML StartState: ", properties);
    all.push(fsa.StartState.create(properties));  
}
function newUmlEndState(){
    var properties = {
	position: {x: opt("uml", "positionX"), y: opt("uml", "positionY")}	
    };
    console.log("UML EndState: ", properties);
    all.push(fsa.EndState.create(properties));  
}
