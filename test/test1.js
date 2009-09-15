var isDrag = false;
var dragger = function(e){
    this.dx = e.clientX;
    this.dy = e.clientY;
    isDrag = this;
    this.animate({"fill-opacity": .1}, 500);
    e.preventDefault && e.preventDefault();
};

var r = Raphael("world", 640, 480);
//var obj1 = r.rect(50, 50, 100, 100);
//var obj1 = r.circle(80, 80, 50);
var obj1 = r.ellipse(300, 400, 50, 30);
obj1.attr({"fill": "blue", "fill-opacity": .2});
obj1.node.style.cursor = "move";
obj1.show();
var obj2 = r.rect(300, 50, 100, 100);
obj2.attr({"fill": "yellow", "fill-opacity": .2});
obj2.node.style.cursor = "move";
obj2.show();
var obj3 = r.circle(100, 200, 50);
obj3.attr({"fill": "green", "fill-opacity": .2});
obj3.node.style.cursor = "move";
obj3.show();
var obj4 = r.circle(500, 200, 50);
obj4.attr({"fill": "black", "fill-opacity": .2});
obj4.node.style.cursor = "move";
obj4.show();
var obj5 = r.circle(500, 400, 50);
obj5.attr({"fill": "red", "fill-opacity": .2});
obj5.node.style.cursor = "move";
obj5.show();


obj1.joint(obj2);
obj3.joint(obj1, {stroke: "red"});
obj2.joint(obj3, {stroke: "green"});
obj4.joint(obj3);
obj5.joint(obj3);

/*
var ba = obj1.joints[0].engine.basicArrow.join(",");
console.log(ba);
var oba = r.path({stroke: "#000", "stroke-width": 2}, ba);
oba.rotate(80);
*/

obj1.mousedown(dragger);
obj2.mousedown(dragger);
obj3.mousedown(dragger);
obj4.mousedown(dragger);
obj5.mousedown(dragger);

document.onmousemove = function(e){
    e = e || window.event;
    if (isDrag) {
        isDrag.translate(e.clientX - isDrag.dx, e.clientY - isDrag.dy);
        r.safari();
        isDrag.dx = e.clientX;
        isDrag.dy = e.clientY;
    }
};
document.onmouseup = function(){
    isDrag && isDrag.animate({"fill-opacity": .2}, 500);
    isDrag = false;
};



