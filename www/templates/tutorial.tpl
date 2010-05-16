<h1 class="subpage-header">Quick tutorial</h1>
<hr/>

<p>
This tutorial is probably your first touch with <em>Joint</em> library. It shows you
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
  <li><tt>joint.dia.uml.js</tt>: Uml StateChart and Class diagram plugin.</li>
  <li><tt>joint.dia.pn.js</tt>: Petri net diagram plugin.</li>
  <li><tt>joint.dia.devs.js</tt>: Discrete Event System Specification diagram plugin.</li>  
</ul>
<p><em>Example: </em>To create a Finite state machine diagram, put these scripts into your document's header:</p>
<pre class="prettyprint">
&lt;script src="raphael-min.js" type="text/javascript"&gt;&lt;/script&gt;
&lt;script src="joint.js" type="text/javascript"&gt;&lt;/script&gt;
&lt;script src="joint.dia.js" type="text/javascript"&gt;&lt;/script&gt;
&lt;script src="joint.dia.fsa.js" type="text/javascript"&gt;&lt;/script&gt;
</pre>
Or alternatively you can use standalone package which includes both
<tt>Joint</tt> and <tt>Joint.dia</tt> libraries,
all plugins and Raphaël library, all in one file.
<pre class="prettyprint">
&lt;script src="joint.all-min.js" type="text/javascript"&gt;&lt;/script&gt;
</pre>
<p>
Then you have to create a holder for diagram.
</p>
<pre class="prettyprint">
&lt;div id="myfsa"&gt;&lt;/div&gt;
</pre>

<p>
Once you have the holder created, you have to initialize diagram paper.
</p>
<pre class="prettyprint">
Joint.paper("myfsa", 620, 200);  /*(id or HTMLElement, width, height)*/
</pre>

<h3>Creating your first Finite State Machine diagram</h3>
<p>Each kind of diagram is implemented as a separate plugin. Elements
are part of a module. FSA module contains elements such as <tt>State</tt>, <tt>StartState</tt> and <tt>EndState</tt>.
A concrete element is created using <tt>create</tt> method. This method takes as an argument object containing
all necessary parameters for the element. (for list of all options, see FSA plugin API)</p>
<pre class="prettyprint">
var s0 = fsa.StartState.create({
  position: {x: 50, y: 50}
});

var s1 = fsa.State.create({
  position: {x: 120, y: 120},
  label: "state 1"
});

var s2 = fsa.State.create({
  position: {x: 300, y: 50},
  label: "state 2"
});

var se = fsa.EndState.create({
  position: {x: 450, y: 150}
});
</pre>

<p>
Joint library provides API for creating your own arrows which reside both connection
ends. Usually, diagram plugins should provide arrows specific for diagrams they implement.
FSA plugin is not an exception.
Connections can register objects to which they can stick. You can also refine what
connection end you want to stick to what object. For normal purposes (especially FSA
diagrams) it is a good practice to create an array which holds all
the diagram elements.
</p>

<pre class="prettyprint">
var all = [s0, s1, s2, se];
s0.joint(s1, fsa.arrow).register(all);
s1.joint(s2, fsa.arrow).register(all);
s2.joint(se, fsa.arrow).register(all);
</pre>

<p>
The final diagram is by default interactive,
so you can drag arrows, break connections and move states:
</p>

<div style="border: 1px solid gray" id="myfsa"></div>
<script type="text/javascript">
Joint.paper("myfsa", 620, 200);  /*(id or HTMLElement, width, height)*/
var fsa = Joint.dia.fsa;

var s0 = fsa.StartState.create({
  position: {x: 50, y: 50}
});

var s1 = fsa.State.create({
  position: {x: 120, y: 120},
  label: "state 1"
});

var s2 = fsa.State.create({
  position: {x: 300, y: 50},
  label: "state 2"
});

var se = fsa.EndState.create({
  position: {x: 450, y: 150}
});

var all = [s0, s1, s2, se];
s0.joint(s1, fsa.arrow).register(all);
s1.joint(s2, fsa.arrow).register(all);
s2.joint(se, fsa.arrow).register(all);
</script>
















<h3>Hello world!</h3>
<p>
<em>Joint</em> library is independent of diagram plugins. It means that
it can be used itself for connecting vector objects created by
Raphaël library. It can be usefull if you just want a functionality
of connecting vector objects together. Connections as well as arrows
and behavior is fully customizable. For more details, see Joint library
API.
</p>
<pre class="prettyprint">
&lt;html&gt;
&lt;head&gt;
&lt;script type="text/javascript" src="joint.all-min.js"&gt;&lt;/script&gt;
&lt;/head&gt;
&lt;body&gt;
&lt;div id="hello_world"&gt;&lt;/&gt;
&lt;script type="text/javascript"&gt;
var
r = Raphael("hello_world", 620, 50),
c1 = r.circle(50, 20, 10),
c2 = r.circle(250, 25, 10);
c1.joint(c2);
&lt;/script&gt;
&lt;/body&gt;
&lt;/html&gt;
</pre>

<div style="border: 1px solid gray" id="hello_world"></div>
<script type="text/javascript">
var
r = Raphael("hello_world", 620, 50),
c1 = r.circle(50, 20, 10),
c2 = r.circle(250, 25, 10);

c1.joint(c2);
</script>



