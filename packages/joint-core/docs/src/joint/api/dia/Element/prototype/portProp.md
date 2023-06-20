<pre class="docs-method-signature"><code>element.portProp(portId, path, [value])</code></pre>

Set properties, possibly nested, on the element port. This is an equivalent of the <a href="#dia.Element.prototype.attr">attr()</a> method but this time for custom data properties.

```javascript
element.portProp('port-id', 'attrs/circle/fill', 'red');
element.portProp('port-id', 'attrs/circle/fill');  // 'red'

element.portProp('port-id', 'attrs/circle', { r: 10, stroke: 'green' });
element.portProp('port-id', 'attrs/circle'); // { r: 10, stroke: 'green', fill: 'red' }

```
