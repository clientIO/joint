var r = Raphael("world", 640, 480);

var isDrag = false;
var dragger = function(e){
    this.dx = e.clientX;
    this.dy = e.clientY;
    isDrag = this;
    this.animate({"fill-opacity": .1}, 500);
    e.preventDefault && e.preventDefault();
};

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
    isDrag && isDrag.animate({"fill-opacity": 1.0}, 500);
    isDrag = false;
};

function createMyObject(type, geometry, attrs){
    var obj = r[type].apply(r, geometry).attr(attrs);
    obj.node.style.cursor = "move";
    obj.show();
    obj.mousedown(dragger);
    return obj;
}

/**************************************************/

var o1 = createMyObject("ellipse", [300, 400, 50, 30], {fill: "blue"});
var o2 = createMyObject("rect", [300, 50, 150, 100], {fill: "yellow"});
var o3 = createMyObject("circle", [100, 300, 50], {fill: "green"});
//var o4 = createMyObject("path", [{}, "M100 100L190 190"], {stroke: "black", "stroke-width": 2.0});

var p = ["M","51.273","25.361","c","5.094","0.745","9.829-2.785","10.569-7.873","c","0.74-5.097-2.781-9.825-7.871-10.563","c","-5.101-0.747-9.828","2.777-10.573","7.867","C","42.659","19.88","46.176","24.623","51.273","25.361","z",
	 "M","64.783","38.152","l","0.818-0.628","l","-8.379-10.211","l","-9.549-0.503","l","-0.355-0.021","l","-3.684-4.031","l","-1.11","0.795","l","-4.886-5.739","c","-1.046-1.213-2.678-1.485-3.651-0.591","c","-0.968","0.898-0.909","2.61","0.132","3.834","l","4.512","5.293","l","-1.181","0.848","l","4.033","5.304","l","-0.68","14.833","c","-1.137","0.375-1.964","1.429-1.964","2.694v6.723","c","-3.017","0.634-5.283","3.31-5.283","6.51","c","0","3.678","2.979","6.654","6.65","6.654","c","3.678","0","6.658-2.977","6.658-6.654","c","0-2.007-0.91-3.785-2.319-5.008v-1.146","c","0.71","0.328","1.504","0.557","2.364","0.632","l","4.151","0.376v9.144","c","0","1.58","1.271","2.855","2.845","2.855","c","1.57","0","2.848-1.275","2.848-2.855V56.435","c","0.59-0.632","0.982-1.39","1.059-2.243","l","0.166-1.844","l","1.25","0.06","l","0.467-10.351","l","1.299-0.997","l","3.111","4.324","c","0.936","1.308","2.586","1.771","3.688","1.047","c","1.098-0.738","1.223-2.381","0.295-3.688","L","64.783","38.152z M","57.783","38.139","c","-0.121","2.312-0.652","2.666-2.938","2.547","l","-2.092-0.11","c","-1.572-0.084-2.177-0.564-2.077-2.432","l","0.029-0.594","l","1.723","0.091","c","-0.039","0.915","0.197","0.995","0.693","1.025","l","2.119","0.107","c","0.363","0.019","0.74-0.021","0.773-0.682","c","0.039-0.745-0.158-0.803-2.387-0.922","c","-2.592-0.135-2.863-0.624-2.752-2.742","c","0.083-1.56","0.236-2.758","2.415-2.641","l","2.4","0.127","c","1.992","0.104","2.125","1.146","2.045","2.658","l","-0.014","0.274","l","-1.729-0.09","c","0.033-0.631","0.002-0.896-0.781-0.937","l","-1.912-0.101","c","-0.393-0.021-0.664","0.167-0.689","0.633","c","-0.039","0.751","0.168","0.786","2.021","0.87","C","57.309","35.352","57.914","35.635","57.783","38.139","z"];
var o4 = createMyObject("path", [p.join(" ")], {fill: "#CB9737", stroke: "black", "stroke-width": 2.0});

var opt1 = {
    attrs: {stroke: "red", "stroke-dasharray": "none"},
    startArrow: {type: "basic"},
    endArrow: {attrs: {fill: "red"}},
    bboxCorrection: {
	start: {
	    x: 0,
	    width: 0
	}
    }
};

var opt2 = {
    attrs: {stroke: "black", "stroke-width": 1.0, "stroke-dasharray": "-"},
    startArrow: {type: "basic", attrs: {stroke: "black", fill: "black"}},
    endArrow: {type: "hand", attrs: {stroke: "black", fill: "yellow"}},
    bboxCorrection: {
	end: {
	    x: 50,
	    width: -100
	}
    }
};

o1.joint(o2, opt1);
o1.joint(o3, {endArrow: {type: "flower", attrs: {fill: "orange"}}});
o2.joint(o4, opt2);

Joint.registeredObjects.push(o1);
Joint.registeredObjects.push(o2);
Joint.registeredObjects.push(o3);
Joint.registeredObjects.push(o4);







