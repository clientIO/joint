/**
 * Main joint.js file.
 * @author David Durman
 */

/**************************************************
 * Machine
 **************************************************/

var JointMachine = qhsm("Idle");
JointMachine.addSlots({path: null, from: null, to: null});
JointMachine.addMethod("mymethod", function(){alert(this.from)});

JointMachine.addState("Idle", "top", {
    entry: function(){},
    exit: function(){},
//    init: "Connected",
    connect: {
//	guard: function(e){return true},
	action: function(e){this.mymethod()},
	target: "Connected"
    }
});// Idle state

JointMachine.addState("Connected", "Idle", {
    entry: function(){
	var r = this.from.paper;
	var bb1 = this.from.getBBox();
	var bb2 = this.to.getBBox();
	var p = ["M", bb1.x + bb1.width/2, bb1.y + bb1.height/2, "L", bb2.x + bb2.width/2, bb2.y + bb2.height/2].join(",");
	this.path = r.path({stroke: "#036"}, p);
	this.path.toBack();
	this.path.show();
    },
    exit: function(){},
    step: {
//	guard: function(e){return true},
	action: function(e){
	    var r = this.from.paper;
	    this.path.remove();
	    var bb1 = this.from.getBBox();
	    var bb2 = this.to.getBBox();
	    var p = ["M", bb1.x + bb1.width/2, bb1.y + bb1.height/2, "L", bb2.x + bb2.width/2, bb2.y + bb2.height/2].join(",");
	    this.path = r.path({stroke: "#036"}, p);
	    this.path.toBack();
	    this.path.show();
	}
    }
});// Connected state

/**************************************************
 * Joint
 **************************************************/

function Joint(){
    this.machine = JointMachine.clone();
}

Raphael.el.joint = function(to){
    var j = new Joint();
    j.machine.from = this;
    j.machine.to = to;
    this.j = j;
    to.j = j;
    j.machine.dispatch(qevt("connect"));
};

var _translate = Raphael.el.translate;
Raphael.el.translate = function(x, y){
    _translate.call(this, x, y);
    this.j && this.j.machine.dispatch(qevt("step"));
}



