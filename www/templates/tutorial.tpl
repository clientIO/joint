<h1 class="subpage-header">Quick tutorial</h1>
<hr/>

<p>
This tutorial is probably your first touch with <em>JointJS</em> library. It shows you
how to create a simple Finite State Machine diagram. At the end of this tutorial
you can also find a popular "Hello world" program.
</p>
<h3>Getting started</h3>

<h4>Scripts:</h4>
<ul>
  <li><tt>raphael-min.js</tt>: <a href="http://raphaeljs.com">Raphaël</a> library,
  provides cross browser abstract layer for rendering vector objects.</li>
  <li><tt>joint.js</tt>: Joint library core.</li>
  <li><tt>joint.dia.js</tt>: Joint diagramming library core, provides abstraction
  for diagrams elements.
  (necessary for diagram plugins, see below)</li>
  <li><tt>joint.dia.fsa.js</tt>: Finite state machine diagram plugin.</li>
</ul>
<p><em>Example: </em>To create a Finite state machine diagram, put these scripts into your document's header:</p>
<pre>
    <code>
&lt;script src="raphael-min.js" type="text/javascript"&gt;&lt;/script&gt;
&lt;script src="joint.min.js" type="text/javascript"&gt;&lt;/script&gt;
&lt;script src="joint.dia.min.js" type="text/javascript"&gt;&lt;/script&gt;
&lt;script src="joint.dia.fsa.min.js" type="text/javascript"&gt;&lt;/script&gt;
    </code>
</pre>
Or alternatively you can use the standalone package provided which includes both
<tt>Joint</tt> and <tt>Joint.dia</tt> libraries, all plugins and Raphaël library, all in one file.
<pre>
    <code>
&lt;script src="joint.all-min.js" type="text/javascript"&gt;&lt;/script&gt;
    </code>
</pre>
<p>
Then you have to create a holder for your diagram.
</p>
<pre>
    <code>
&lt;div id="myfsa"&gt;&lt;/div&gt;
    </code>
</pre>

<p>
Once you have the holder created, you have to initialize diagram paper.
</p>
<pre>
    <code>
Joint.paper("myfsa", 1000, 200);  /*(id or HTMLElement, width, height)*/
    </code>
</pre>

<h4>Creating your first Finite State Machine diagram</h4>
<p>Each kind of diagram is implemented as a separate plugin. 
FSA plugin contains elements such as <tt>State</tt>, <tt>StartState</tt>, <tt>EndState</tt>
and definition of the arrow suitable for FSA diagrams <tt>Joint.dia.fsa.arrow</tt>.
Concrete elements are created using <tt>create</tt> method. This method takes as an argument object containing
all necessary parameters for the element. (for list of all options, see FSA plugin API)</p>
<pre>
    <code>
var s0 = fsa.StartState.create({ position: {x: 50, y: 50} });
var se = fsa.EndState.create({ position: {x: 450, y: 150} });
var s1 = fsa.State.create({ position: {x: 120, y: 120}, label: "state 1" });
var s2 = fsa.State.create({ position: {x: 300, y: 50}, label: "state 2" });
    </code>
</pre>

<p>
Joint library provides API for creating your own arrows which reside both connection
ends. Usually, diagram plugins should provide arrows specific for diagrams they implement.
Connections can register objects to which they can stick. You can also refine what
connection end you want to stick to what object. For normal purposes (especially FSA
diagrams) it is a good practice to create an array which holds all
the diagram elements. Note the usage of <tt>registerForever()</tt> method. The difference
between <tt>register()</tt> and <tt>registerForever</tt> is that the latter stores
a reference to the array object provided as the only argument. That means that
all elements added later to the array are registered as well.
</p>

<pre>
    <code>
var all = [s0, s1, s2, se];
s0.joint(s1, fsa.arrow).registerForever(all);
s1.joint(s2, fsa.arrow).registerForever(all);
s2.joint(se, fsa.arrow).registerForever(all);
    </code>
</pre>

<p>
The final diagram is by default interactive. You can drag arrows, break connections and move states:
</p>

<div style="border: 1px solid gray; background-color: white;" id="myfsa"></div>
<script type="text/javascript">
Joint.paper("myfsa", 1000, 200);  /*(id or HTMLElement, width, height)*/
var fsa = Joint.dia.fsa;

var s0 = fsa.StartState.create({ position: {x: 50, y: 50} });
var se = fsa.EndState.create({ position: {x: 450, y: 150} });
var s1 = fsa.State.create({ position: {x: 120, y: 120}, label: "state 1" });
var s2 = fsa.State.create({ position: {x: 300, y: 50}, label: "state 2" });

var all = [s0, s1, s2, se];
s0.joint(s1, fsa.arrow).registerForever(all);
s1.joint(s2, fsa.arrow).registerForever(all);
s2.joint(se, fsa.arrow).registerForever(all);
</script>

<h4>Hello world!</h4>
<p>
<em>Joint</em> library is independent of diagram plugins. It means that
it can be used on its own for connecting vector objects created by
Raphaël library. This is useful if you just want a functionality
of connecting vector objects together. Connections as well as arrows
and behavior is fully customizable. For more details, see Joint library
API.
</p>
<pre>
    <code>
&lt;html&gt;
&lt;head&gt;
&lt;script type="text/javascript" src="raphael-min.js"&gt;&lt;/script&gt;
&lt;script type="text/javascript" src="joint.min.js"&gt;&lt;/script&gt;
&lt;/head&gt;
&lt;body&gt;
&lt;div id="hello_world"&gt;&lt;/&gt;
&lt;script type="text/javascript"&gt;
var r = Raphael("hello_world", 1000, 50),
    c1 = r.circle(50, 20, 10),
    c2 = r.circle(250, 25, 10);
c1.joint(c2);
&lt;/script&gt;
&lt;/body&gt;
&lt;/html&gt;
    </code>
</pre>

<div style="border: 1px solid gray; background-color: white;" id="hello_world"></div>
<script type="text/javascript">
var
r = Raphael("hello_world", 1000, 50),
c1 = r.circle(50, 20, 10),
c2 = r.circle(250, 25, 10);

c1.joint(c2);
</script>



