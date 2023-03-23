<pre class="docs-method-signature"><code>element.fitToChildren([opt])</code></pre>

Resize and reposition this element such that all of its embedded child elements end up within this element's new bounding box.

Starting from a given element, this function proceeds <q>downwards</q> through that element's children (and further descendants, if `opt.deep` is used). In that sense, this function is the opposite of the `element.fitParent` [function](#dia.Element.prototype.fitParent).

Available options:

<table>
    <tr>
        <th>padding</th>
        <td><i>number</i></td>
        <td>Inflate this element's calculated bounding box by this much additional padding.</td>
    </tr>
    <tr>
        <th>expandOnly</th>
        <td><i>boolean</i></td>
        <td>If <code>true</code>, the algorithm is only ever allowed to expand the bounding box of this element, never to shrink it. You can visualize this setting as the algorithm dragging the top-left and bottom-right corners of this element's bounding box <strong>outward</strong> until all its embedded child elements are within the bounding box.</td>
    </tr>
    <tr>
        <th>shrinkOnly</th>
        <td><i>boolean</i></td>
        <td>
            <p>If <code>true</code>, the algorithm is only ever allowed to shrink the bounding box of this element, never to expand it. You can visualize this setting as the algorithm dragging the top-left and bottom-right corners of this element's bounding box <strong>inward</strong> until only its embedded child elements are within the bounding box.</p>
            <p>If only a portion of an embedded child element initially overlaps this element, the calculated bounding box will only include that portion. If there is no overlap between this element and its children (i.e. all children are currently placed <q>outside</q> of this element), then this function does nothing (since satisfying the shrink-only restriction is impossible).</p>
        </td>
    </tr>
    <tr>
        <th>deep</th>
        <td><i>boolean</i></td>
        <td>
            <p>If <code>true</code>, this algorithm is applied recursively on all embedded children of this element which have embedded children of their own, and so on. The bounding box algorithm is evaluated in reverse-depth order - starting from the deepest descendant, then going up (i.e. to this element). This ensures that any paddings applied on lower-level elements are taken into account by higher-level elements.</p>
            <p>Note that if this option is used in conjunction with <code>opt.shrinkOnly</code>, the algorithm is still applied strictly recursively - one level at a time. Therefore, even if this element's current bounding box completely overlaps one of its grandchild elements, this element's calculated bounding box will shrink only based on the grandchild's parent (this element's child), which may mean that the grandchild element will end up outside of the calculated bounding box of this element.</p>
        </td>
    </tr>
</table>
