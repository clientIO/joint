<pre class="docs-method-signature"><code>element.removePorts(ports [, opt])</code></pre>

Remove an array of `ports` from the element.

The ports can be specified as [Port interfaces](#dia.Element.ports.interface) or `portIds`. The function skips over any ports in the array that do not exist on the element.

<pre class="docs-method-signature"><code>element.removePorts([opt])</code></pre>

If no array is provided, the function removes all ports from the element.
