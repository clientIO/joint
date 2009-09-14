/**
 * Quantum hierarchical state machines in JavaScript.
 * @author David Durman, 2009
 */


// helper asString function
function asString(obj){
    if (obj && obj._QState)
	return obj.name;
    if (obj !== null)
	return obj.toString();
    return "null";
}

//////////////////////////////////////////////////
// QHsm.
//////////////////////////////////////////////////

/**
 * myState - the current state
 * mySource - the source of the current transition
 */
function QHsm(initialStateName){
    this.initialState(initialStateName);
}


// called when constructed
QHsm.prototype.initialState = function(aStateOrName){
    this.myState = this.top();
    this.mySource = this.state(aStateOrName);
}

/**
 * Trigger the initial transition and recursively enter the submachine of the top state.
 * Must be called only once for a given QHsm before dispatching any events to it.
 */
QHsm.prototype.init = function(anEventOrNil){
//    eval(assert(this.myState.name == "TOP" && this.mySource != null));
    var s = this.myState;	// save top in temp
    this.mySource.trigger(anEventOrNil);	// topmost initial transition
//    eval(assert(s.equals(this.myState.superstate())));	// verify that we only went one level deep
    s = this.myState;
    s.enter();
    while (s.init() === null){	// while init is handled
//	eval(assert(s.equals(this.myState.superstate())));	// verify that we only went one level deep
	s = this.myState;
	s.enter();
    }
}

QHsm.prototype.state = function(stateOrName){ 
    if (stateOrName && stateOrName._QState)
	return stateOrName;
    return new QState(this, stateOrName) 
}
QHsm.prototype.top = function(stateOrName){ return new QState(this, "TOP") }
QHsm.prototype.currentState = function(){ return this.myState }
QHsm.prototype.selectorFor = function(stateName){ return "state" + stateName }
QHsm.prototype.dispatchEvent = function(anEvent, aSelector){ 
    return this[aSelector](anEvent) 
}

/**
 * This should not be overridden.
 */
QHsm.prototype.stateTOP = function(anEvent){
    if (anEvent.type === "entry" ||
	anEvent.type === "exit" ||
	anEvent.type === "init" ||
	anEvent.type === "empty")
	return null;
    return this.handleUnhandledEvent(anEvent);
}

/**
 * Override this when needed.
 */
QHsm.prototype.handleUnhandledEvent = function(anEvent){
    return null;
}

/**
 * Traverse the state hierarchy starting from the currently active state myState.
 * Advance up the state hierarchy (i.e., from substates to superstates), invoking all
 * the state handlers in succession. At each level of state nesting, it intercepts the value
 * returned from a state handler to obtain the superstate needed to advance to the next level.
 */
QHsm.prototype.dispatch = function(anEvent){
    if (!(anEvent && anEvent._QEvent))
	anEvent = new QEvent(anEvent);
    this.mySource = this.myState;
    while (this.mySource !== null){
	this.mySource = this.mySource.trigger(anEvent);
    }
}

/**
 * Performs dynamic transition. (macro Q_TRAN_DYN())
 */
QHsm.prototype.newState = function(aStateName){ 
    this.transition(this.state(aStateName)); 
    return null;
}

/**
 * Used by handlers only in response to the #init event. (macro Q_INIT())
 * USAGE: return this.newInitialState("whatever");
 * @return nil for convenience
 */
QHsm.prototype.newInitialState = function(aStateOrName){ 
    this.myState = this.state(aStateOrName); 
    return null;
}

/**
 * Dynamic transition. (Q_TRAN_DYN())
 */
QHsm.prototype.transition = function(target){
//    eval(assert(!target.equals(this.top())));
    var entry = [];
    var thisMySource = this.mySource;	// for better performance

    // exit all the nested states between myState and mySource
    var s = this.myState;
    while (!s.equals(thisMySource)){
//	eval(assert(s != null));
	s = s.exit() || s.superstate();
    }

    // check all seven possible source/target state combinations
    entry[entry.length] = target;

    // (a) mySource == target (self transition)
    if (thisMySource.equals(target)){
	thisMySource.exit();
	return this.enterVia(target, entry);
    }

    // (b) mySource == target.superstate (one level deep)
    var p = target.superstate();
    if (thisMySource.equals(p))
	return this.enterVia(target, entry);
    
//    eval(assert(thisMySource != null));

    // (c) mySource.superstate == target.superstate (most common - fsa)
    var q = thisMySource.superstate();
    if (q.equals(p)){
	thisMySource.exit();
	return this.enterVia(target, entry);
    }

    // (d) mySource.superstate == target (one level up)
    if (q.equals(target)){
	thisMySource.exit();
	entry.pop();	// do not enter the LCA
	return this.enterVia(target, entry);
    }
    
    // (e) mySource == target.superstate.superstate... hierarchy (many levels deep)
    entry[entry.length] = p;
    s = p.superstate();
    while (s !== null){
	if (thisMySource.equals(s))
	    return this.enterVia(target, entry);
	entry[entry.length] = s;
	s = s.superstate();
    }

    // otherwise we're definitely exiting mySource
    thisMySource.exit();

    // entry array is complete, save its length to avoid computing it repeatedly
    var entryLength = entry.length;

    // (f) mySource.superstate == target.superstate.superstate... hierarchy
    var lca;
    for (lca = entryLength - 1; lca > 0; lca--){
	if (q.equals(entry[lca])){
	    return this.enterVia(target, entry.slice(0, lca - 1)); // do not enter lca
	}
    }

    // (g) each mySource.superstate.superstate... for each target.superstate.superstate...
    s = q;
    while (s !== null){
	for (lca = entryLength - 1; lca > 0; lca--){
	    if (s.equals(entry[lca])){
		return this.enterVia(target, entry.slice(0, lca - 1)); // do not enter lca
	    }
	}
	s.exit();
	s = s.superstate();
    }
}

// tail of transition()
// we are in the LCA of mySource and target
QHsm.prototype.enterVia = function(target, entry){
    // retrace the entry path in reverse order
    var entryLength = entry.length;
    for (var i = entryLength - 1; i >= 0; i--){
	entry[i].enter();
    }
    this.myState = target;
    while (target.init() == null){
	// initial transition must go one level deep
//	eval(assert(target.equals(this.myState.superstate())));	
	target = this.myState;
	target.enter();
    }
}

//////////////////////////////////////////////////
// QState.
//////////////////////////////////////////////////

function QState(fsm, name){
    this.fsm = fsm;
    this.name = name;
    this._QState = true;
}

QState.prototype.equals = function(state){
    return (this.name === state.name && this.fsm === state.fsm)
}
QState.prototype.dispatchEvent = function(anEvent, aSelector){ 
    return this.fsm.dispatchEvent(anEvent, aSelector);
}
QState.prototype.trigger = function(anEvent){
    var evt = anEvent || new QEvent("NullEvent");
    var selector = this.fsm.selectorFor(this.name);
    //!//TODO: if selector is null than throw an error: "no handler for anEvent.type in state this.name"
    return this.dispatchEvent(evt, selector);
}

QState.prototype.enter = function(){ return this.trigger(QEventEntry) }
QState.prototype.exit = function(){ return this.trigger(QEventExit) }
QState.prototype.init = function(){ return this.trigger(QEventInit) }

/**
 * Answer my superstate. Default is to return fsm top state.
 */
QState.prototype.superstate = function(){ 
    var superstate = this.trigger(new QEvent("empty"));
    if (superstate && superstate._QState)
	return superstate;
    superstate = this.fsm.top();
    if (this.name === superstate.name)
	return null;
    return superstate;
    //return this.fsm.top();
}

//////////////////////////////////////////////////
// QEvent.
//////////////////////////////////////////////////

function QEvent(type, args){
    this.type = type;
    this.args = args;
    this._QEvent = true;
}

// this events are static, they do not carry any arguments
// -> create them only once
var QEventEntry = new QEvent("entry");
var QEventExit = new QEvent("exit");
var QEventInit = new QEvent("init");


//////////////////////////////////////////////////
// QHsm wrapper for simple machine creation
//////////////////////////////////////////////////

function qevt(sig, args){ return new QEvent(sig, args) }

function qhsm(initialState){
    var m = function(){
	this.base = QHsm;
	this.base("Initial");
    };
    m.prototype = new QHsm;
    m.prototype.stateInitial = function(e){
	this.newInitialState(initialState);
    };
    var _archSlots = [];
    /**
     * Add new slots to the machine.
     * @param slots object slots names and their initial values
     */
    m.prototype.addSlots = function(slots){
	_archSlots.push(slots);
	for (var s in slots)
	    this[s] = slots[s];
    };
    var _archMethods = [];
    /**
     * Add custom method to the machine.
     * @param name string name of the method
     * @param lambda function an anonymous function
     */
    m.prototype.addMethod = function(name, lambda){
	_archMethods.push([name, lambda]);
	this[name] = lambda;
    }
    var _archStates = [];	// save added states for clone operation
    /**
     * Add a new state to the machine.
     * @param name string name of the new state
     * @param superstate string name of my superstate (or "top" if it is a top state)
     * @param acts object state actions and transition reacting on custom events
     */
    m.prototype.addState = function(name, superstate, acts){
	_archStates.push([name, superstate, acts]);
	var fcode = "switch (e.type) {\n";
	for (a in acts){
	    var act = acts[a].toString();
	    // entry/exit
	    if (a === "entry" || a === "exit")
		fcode += "case \"" + a + "\":" + act.slice(act.search("{") + 1, act.lastIndexOf("}")) + "; return null;\n";
	    // init
	    else if (a === "init")
		fcode += "case \"init\": this.newInitialState(\"" + act + "\"); return null;\n";
	    // custom event
	    else { 
		var gstr = (acts[a].guard) ? acts[a].guard.toString() : null;
		gstr = (gstr) 
		    ? "(function(){" + gstr.slice(gstr.search("{") + 1, gstr.lastIndexOf("}")) + "}).apply(this)"
		    : "true";
		var astr = (acts[a].action) ? acts[a].action.toString() : null;
		astr = (astr)
		    ? astr.slice(astr.search("{") + 1, astr.lastIndexOf("}"))
		    : "";
		var tstr = acts[a].target;
		tstr = (tstr)
		    ? "this.newState(\"" + tstr + "\");\n"
		    : "";
		fcode += "case \"" + a + "\": if (" + gstr + "){\n" + astr + tstr + "};\n";
		fcode += "return null;\n";
	    }
	}
	fcode += (superstate === "top")
	    ? "} return this.top();"
	    : "} return this.state(\"" + superstate + "\");";
//	alert(fcode);
	this["state" + name] = new Function("e", fcode);
    };
    /**
     * Use this method to create a new machine instance.
     */
    m.prototype.clone = function(){
	var newm = new m();
	// clone states
	for (var i = _archStates.length - 1; i >= 0; --i)
	    newm.addState(_archStates[i][0], _archStates[i][1], _archStates[i][2]);
	// clone slots
	for (var i = _archSlots.length - 1; i >= 0; --i)
	    newm.addSlots(_archSlots[i]);
	// clone methods
	for (var i = _archMethods.length - 1; i >= 0; --i)
	    newm.addMethod(_archMethods[i][0], _archMethods[i][1]);
	// initialize the machine
	newm.init(null);
	return newm;
    }
    return new m();
};

