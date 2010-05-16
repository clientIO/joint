<h1 class="subpage-header">User's manual</h1>
<hr/>

<p>
This page is an overview of user interaction with diagrams. Although
the interaction is very intuitive, some remarks can be handy. Note that
the interaction described in this article assumes that the appropriate
options are enabled. 
</p>
<hr/>
<p>
Connections' arrows can be dragged and dropped to an arbitrary place.
If the place is not occupied by a diagram element and/or the arrow has not
the element registered, it is just droppped on the place without any
action. To drag an arrow, just grab it and move it. Note that some arrows are hard
to grab. Especially arrows which are very small. For this purpose Joint library
introduces handles. Handles are objects that can be grabbed instead of arrows.
Handles are invisible until you move mouse pointer over a connection.
<img style="float: left" src="img/nostick.png" alt="not sticked arrow"/>
<img style="float: right" src="img/handles.png" alt="handles"/>
</p>
<hr/>
<p>
If there is an element registered for the arrow, the arrow sticks
to the element.
<img style="float: right" src="img/stick.png" alt="sticked arrow"/>
</p>
<hr/>
<p>
Connections can be broken. It means that you can create zig-zag connections.
It is usefull, in particular, if you want the connection to go round an element.
You can create an arbitrary number of vertices.
It is important to note that in the current release new vertices can be added only
to the beginning or to the end of a connection! 
<img style="float: left" src="img/zigzag.png" alt="zig-zag connection"/>
</p>
<hr/>
<p>
Newly created vertices can be moved. If you click nearby an already created
vertex, the vertex is considered to be moved. You can place the vertex
wherever you want by dragging it.
<img style="float: right" src="img/vertexmove.png" alt="vertex moving"/>
</p>
<hr/>
