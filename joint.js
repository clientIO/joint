/**
 * Main joint.js file.
 * @author David Durman
 */

/**************************************************
 * Machine
 **************************************************/

var JointMachine = qhsm("Idle");
JointMachine.addSlots({line: null, from: null, to: null});

JointMachine.addState("Idle", "top", {
    entry: function(){},
    exit: function(){},
    connect: {
	guard: function(e){return true},
	action: function(e){
	    this.from = e.args[0];
	    this.to = e.args[1];
	},
	target: "Connected"
    }
});// Idle state

JointMachine.addState("Connected", "Idle", {
    entry: function(){
	var r = this.from.paper;
	var bb1 = this.from.getBBox();
	var bb2 = this.to.getBBox();
	var p = ["M", bb1.x + bb1.width/2, bb1.y + bb1.height/2, "L", bb2.x + bb2.width/2, bb2.y + bb2.height/2].join(",");
	this.line = r.path({stroke: "#036"}, p);
	this.line.toBack();
	this.line.show();
    },
    exit: function(){},
    step: {
	guard: function(e){return true},
	action: function(e){
	    var r = this.from.paper;
	    this.line.remove();
	    var bb1 = this.from.getBBox();
	    var bb2 = this.to.getBBox();
	    var p = ["M", bb1.x + bb1.width/2, bb1.y + bb1.height/2, "L", bb2.x + bb2.width/2, bb2.y + bb2.height/2].join(",");
	    this.line = r.path({stroke: "#036"}, p);
	    this.line.toBack();
	    this.line.show();
	}
    }
});// Connected state

/**************************************************
 * Joint
 **************************************************/

function Joint(){
    this.path = null;	// path
    this.machine = JointMachine.clone();
}

Raphael.el.joint = function(to){
    this.j = new Joint();
    to.j = this.j;
    this.j.machine.dispatch(qevt("connect", [this, to]));
};

var _translate = Raphael.el.translate;
Raphael.el.translate = function(x, y){
    _translate.call(this, x, y);
    this.j && this.j.machine.dispatch(qevt("step"));
}



