<pre class="docs-method-signature"><code>element.removePorts(ports, [opt])</code></pre>

Takes an array of [Port interfaces](#portinterface) or `portIds` and removes them from the element. Will ignore ports specified that are not on the element. Faster than removing the ports individually.

<pre class="docs-method-signature"><code>element.removePorts([opt])</code></pre>

If no array is given it will remove all ports from the element. Faster than removing the ports individually.
