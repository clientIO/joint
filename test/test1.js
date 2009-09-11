var isDrag = false;
var dragger = function(e){
    this.dx = e.clientX;
    this.dy = e.clientY;
    isDrag = this;
    this.animate({"fill-opacity": .5}, 500);
    e.preventDefault && e.preventDefault();
};

var r = Raphael("world", 640, 480);
var obj1 = r.rect(50, 50, 100, 100);
obj1.attr("fill", "blue");
obj1.show();
var obj2 = r.rect(300, 50, 100, 100);
obj2.attr("fill", "yellow");
obj2.show();
obj1.joint(obj2);

obj1.mousedown(dragger);
obj2.mousedown(dragger);

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
    isDrag && isDrag.animate({"fill-opacity": 0}, 500);
    isDrag = false;
};



