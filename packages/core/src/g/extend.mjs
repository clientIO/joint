// Local helper function.
// Add properties from arguments on top of properties from `obj`.
// This allows for rudimentary inheritance.
// - The `obj` argument acts as parent.
// - This function creates a new object that inherits all `obj` properties and adds/replaces those that are present in arguments.
// - A high-level example: calling `extend(Vehicle, Car)` would be akin to declaring `class Car extends Vehicle`.
export function extend(obj) {
    // In JavaScript, the combination of a constructor function (e.g. `g.Line = function(...) {...}`) and prototype (e.g. `g.Line.prototype = {...}) is akin to a C++ class.
    // - When inheritance is not necessary, we can leave it at that. (This would be akin to calling extend with only `obj`.)
    // - But, what if we wanted the `g.Line` quasiclass to inherit from another quasiclass (let's call it `g.GeometryObject`) in JavaScript?
    // - First, realize that both of those quasiclasses would still have their own separate constructor function.
    // - So what we are actually saying is that we want the `g.Line` prototype to inherit from `g.GeometryObject` prototype.
    // - This method provides a way to do exactly that.
    // - It copies parent prototype's properties, then adds extra ones from child prototype/overrides parent prototype properties with child prototype properties.
    // - Therefore, to continue with the example above:
    //   - `g.Line.prototype = extend(g.GeometryObject.prototype, linePrototype)`
    //   - Where `linePrototype` is a properties object that looks just like `g.Line.prototype` does right now.
    //   - Then, `g.Line` would allow the programmer to access to all methods currently in `g.Line.Prototype`, plus any non-overridden methods from `g.GeometryObject.prototype`.
    //   - In that aspect, `g.GeometryObject` would then act like the parent of `g.Line`.
    // - Multiple inheritance is also possible, if multiple arguments are provided.
    // - What if we wanted to add another level of abstraction between `g.GeometryObject` and `g.Line` (let's call it `g.LinearObject`)?
    //   - `g.Line.prototype = extend(g.GeometryObject.prototype, g.LinearObject.prototype, linePrototype)`
    //   - The ancestors are applied in order of appearance.
    //   - That means that `g.Line` would have inherited from `g.LinearObject` that would have inherited from `g.GeometryObject`.
    //   - Any number of ancestors may be provided.
    // - Note that neither `obj` nor any of the arguments need to actually be prototypes of any JavaScript quasiclass, that was just a simplified explanation.
    // - We can create a new object composed from the properties of any number of other objects (since they do not have a constructor, we can think of those as interfaces).
    //   - `extend({ a: 1, b: 2 }, { b: 10, c: 20 }, { c: 100, d: 200 })` gives `{ a: 1, b: 10, c: 100, d: 200 }`.
    //   - Basically, with this function, we can emulate the `extends` keyword as well as the `implements` keyword.
    // - Therefore, both of the following are valid:
    //   - `Lineto.prototype = extend(Line.prototype, segmentPrototype, linetoPrototype)`
    //   - `Moveto.prototype = extend(segmentPrototype, movetoPrototype)`

    var i;
    var n;

    var args = [];
    n = arguments.length;
    for (i = 1; i < n; i++) { // skip over obj
        args.push(arguments[i]);
    }

    if (!obj) throw new Error('Missing a parent object.');
    var child = Object.create(obj);

    n = args.length;
    for (i = 0; i < n; i++) {

        var src = args[i];

        var inheritedProperty;
        var key;
        for (key in src) {

            if (src.hasOwnProperty(key)) {
                delete child[key]; // delete property inherited from parent
                inheritedProperty = Object.getOwnPropertyDescriptor(src, key); // get new definition of property from src
                Object.defineProperty(child, key, inheritedProperty); // re-add property with new definition (includes getter/setter methods)
            }
        }
    }

    return child;
}
