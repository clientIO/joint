title('UML Connections test');
description('Exhibition of some UML connections features.');
dimension(800, 900);

var uml = Joint.dia.uml;
var paper = Joint.paper("world", 800, 900);

/**
 * Arrow.
 */

var s1 = uml.State.create({
  rect: {x: 100, y: 50, width: 100, height: 60},
  label: "state 1",
  attrs: {
    fill: "90-#000-green:1-#fff"
  },
  actions: {
    entry: "init()",
    exit: "destroy()"
  }
});

var s2 = uml.State.create({
  rect: {x: 290, y: 50, width: 100, height: 60},
  label: "state 2",
  attrs: {
    fill: "90-#000-red:1-#fff"
  },
  actions: {
    entry: "init()",
    exit: "destroy()"
  }
});

s1.joint(s2, uml.arrow);

/**
 * Bent arrow.
 */

var s3 = uml.State.create({
  rect: {x: 100, y: 180, width: 100, height: 60},
  label: "state 3",
  attrs: {
    fill: "90-#000-yellow:1-#fff"
  },
  actions: {
    entry: "init()",
    exit: "destroy()"
  }
});

var s4 = uml.State.create({
  rect: {x: 290, y: 180, width: 100, height: 60},
  label: "state 4",
  attrs: {
    fill: "90-#000-blue:1-#fff"
  },
  actions: {
    entry: "init()",
    exit: "destroy()"
  }
});

var j34 = s3.joint(s4, uml.arrow).setVertices(["170 130", "250 120"]);
console.log(!j34.isSmooth());

/**
 * Bent smooth arrow.
 */

var s5 = uml.State.create({
  rect: {x: 100, y: 320, width: 100, height: 60},
  label: "state 5",
  attrs: {
    fill: "90-#000-pink:1-#fff"
  },
  actions: {
    entry: "init()",
    exit: "destroy()"
  }
});

var s6 = uml.State.create({
  rect: {x: 290, y: 320, width: 100, height: 60},
  label: "state 6",
  attrs: {
    fill: "90-#000-gray:1-#fff"
  },
  actions: {
    entry: "init()",
    exit: "destroy()"
  }
});

var j56 = s5.joint(s6, uml.arrow).setVertices(["170 270", "250 260"]).toggleSmoothing();
console.log(j56.isSmooth());

/**
 * Disconnect/unregister from joints.
 */

var s7 = uml.State.create({
  rect: {x: 100, y: 460, width: 100, height: 60},
  label: "state 7",
  attrs: {
    fill: "90-#000-pink:1-#fff"
  },
  actions: {
    entry: "init()",
    exit: "destroy()"
  }
});

var s8 = uml.State.create({
  rect: {x: 290, y: 460, width: 100, height: 60},
  label: "state 8",
  attrs: {
    fill: "90-#000-gray:1-#fff"
  },
  actions: {
    entry: "init()",
    exit: "destroy()"
  }
});

var j78 = s7.joint(s8, uml.arrow).setVertices(["170 410", "250 400"]).toggleSmoothing().register([s7, s8]);

s7.unregisterFromJoints();
console.log(j78.registeredObjects().length == 1 && j78.registeredObjects()[0] === s8);
s7.disconnect();
console.log(s7.joints().length == 0);
s8.disconnect();
console.log(s8.joints().length == 0);
console.log(j78.registeredObjects().length == 1 && j78.registeredObjects()[0] === s8);
j78.register(s7);
console.log(j78.registeredObjects().length == 2 && j78.registeredObjects().indexOf(s7) !== -1 && j78.registeredObjects().indexOf(s8) !== -1);

/**
 * Label.
 */

var s9 = uml.State.create({
  rect: {x: 450, y: 50, width: 100, height: 60},
  label: "state 9",
  attrs: {
    fill: "90-#000-green:1-#fff"
  },
  actions: {
    entry: "init()",
    exit: "destroy()"
  }
});

var s10 = uml.State.create({
  rect: {x: 650, y: 50, width: 100, height: 60},
  label: "state 10",
  attrs: {
    fill: "90-#000-red:1-#fff"
  },
  actions: {
    entry: "init()",
    exit: "destroy()"
  }
});

var j910 = s9.joint(s10, uml.arrow).label("label 1");

/**
 * Bent arrow with label.
 */

var s11 = uml.State.create({
  rect: {x: 450, y: 180, width: 100, height: 60},
  label: "state 11",
  attrs: {
    fill: "90-#000-yellow:1-#fff"
  },
  actions: {
    entry: "init()",
    exit: "destroy()"
  }
});

var s12 = uml.State.create({
  rect: {x: 650, y: 180, width: 100, height: 60},
  label: "state 12",
  attrs: {
    fill: "90-#000-blue:1-#fff"
  },
  actions: {
    entry: "init()",
    exit: "destroy()"
  }
});

var j1112 = s11.joint(s12, uml.arrow).setVertices(["470 130", "550 120"]).label("label 2");
console.log(!j1112.isSmooth());

/**
 * Bent smooth arrow with label.
 */

var s13 = uml.State.create({
  rect: {x: 450, y: 320, width: 100, height: 60},
  label: "state 13",
  attrs: {
    fill: "90-#000-pink:1-#fff"
  },
  actions: {
    entry: "init()",
    exit: "destroy()"
  }
});

var s14 = uml.State.create({
  rect: {x: 650, y: 320, width: 100, height: 60},
  label: "state 14",
  attrs: {
    fill: "90-#000-gray:1-#fff"
  },
  actions: {
    entry: "init()",
    exit: "destroy()"
  }
});

var j1314 = s13.joint(s14, uml.arrow).setVertices(["470 270", "550 260"]).toggleSmoothing().label("label 3");
console.log(j1314.isSmooth());


/**
 * Straighten.
 */

var s15 = uml.State.create({
  rect: {x: 450, y: 460, width: 100, height: 60},
  label: "state 15",
  attrs: {
    fill: "90-#000-pink:1-#fff"
  },
  actions: {
    entry: "init()",
    exit: "destroy()"
  }
});

var s16 = uml.State.create({
  rect: {x: 650, y: 460, width: 100, height: 60},
  label: "state 16",
  attrs: {
    fill: "90-#000-gray:1-#fff"
  },
  actions: {
    entry: "init()",
    exit: "destroy()"
  }
});

var j1516 = s15.joint(s16, uml.arrow).setVertices(["470 410", "550 400"]).toggleSmoothing();
console.log(j1516.getVertices().length == 2);
j1516.straighten();
console.log(j1516.getVertices().length == 0);

/**
 * Handles.
 */

var s17 = uml.State.create({
  rect: {x: 100, y: 600, width: 100, height: 60},
  label: "state 17",
  attrs: {
    fill: "90-#000-pink:1-#fff"
  },
  actions: {
    entry: "init()",
    exit: "destroy()"
  }
});

var s18 = uml.State.create({
  rect: {x: 290, y: 600, width: 100, height: 60},
  label: "state 18",
  attrs: {
    fill: "90-#000-gray:1-#fff"
  },
  actions: {
    entry: "init()",
    exit: "destroy()"
  }
});

var j1718 = s17.joint(s18, uml.arrow).setVertices(["160 570", "240 550"]).toggleSmoothing();
j1718.showHandle().toggleHandle().showHandle().hideHandle().toggleHandle();     // handles are shown

/**
 * Highlight/unhighlight.
 */

var s19 = uml.State.create({
  rect: {x: 450, y: 600, width: 100, height: 60},
  label: "state 19",
  attrs: {
    fill: "90-#000-green:1-#fff"
  },
  actions: {
    entry: "init()",
    exit: "destroy()"
  }
});

var s20 = uml.State.create({
  rect: {x: 650, y: 600, width: 100, height: 60},
  label: "state 20",
  attrs: {
    fill: "90-#000-blue:1-#fff"
  },
  actions: {
    entry: "init()",
    exit: "destroy()"
  }
});

var j1920 = s19.joint(s20, uml.arrow).setVertices(["470 570", "630 550"]).toggleSmoothing();
j1920.highlight("green").unhighlight().highlight("red");

/**
 * Bounding box correction.
 */

var s21 = uml.State.create({
  rect: {x: 100, y: 750, width: 100, height: 60},
  label: "state 21",
  attrs: {
    fill: "90-#000-green:1-#fff"
  },
  actions: {
    entry: "init()",
    exit: "destroy()"
  }
});

var s22 = uml.State.create({
  rect: {x: 290, y: 750, width: 100, height: 60},
  label: "state 22",
  attrs: {
    fill: "90-#000-blue:1-#fff"
  },
  actions: {
    entry: "init()",
    exit: "destroy()"
  }
});

var j2122 = s21.joint(s22, uml.arrow).setVertices(["120 700", "250 690"]).toggleSmoothing().register([s21, s22]);
// joint should start in the center of s21
j2122.setBBoxCorrection({
    type: "ellipse",
    x: 30,
    y: 30,
    width: -60,
    height: -60
}, "start");
// joint should keep 20px distance from s22
j2122.setBBoxCorrection({
    type: "ellipse",
    x: -20,
    y: -20,
    width: 40,
    height: 40
}, "end");

/**
 * Self loop.
 */

var s23 = uml.State.create({
  rect: {x: 450, y: 750, width: 100, height: 60},
  label: "state 23",
  attrs: {
    fill: "90-#000-blue:1-#fff"
  },
  actions: {
    entry: "init()",
    exit: "destroy()"
  }
});

var j2323 = s23.joint(s23, uml.arrow).setVertices(["470 720", "600 730"]).register(s23);
