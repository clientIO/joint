var 
r = Raphael("world", 640, 480),
o1 = r.circle(80, 80, 50).attr({"fill": "blue", "fill-opacity": .2}).show(),
o2 = r.circle(300, 50, 50).attr({"fill": "yellow", "fill-opacity": .2}).show();

o1.joint(o2);
o1.animate({cy: 470, r: 10}, 2000, "bounce");
o2.animate({cx: 590}, 2000, "bounce");

