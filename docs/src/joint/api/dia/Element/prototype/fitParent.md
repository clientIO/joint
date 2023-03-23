<pre class="docs-method-signature"><code>element.fitParent([opt])</code></pre>

Resize and reposition this element's embedding parent element such that all of its children (including this element) end up within the parent's new bounding box.

Starting from a given element, this function proceeds <q>upwards</q> to that element's parent (and further ancestors, if `opt.deep` is used). In that sense, this function is the opposite of the `element.fitToChildren` [function](#dia.Element.prototype.fitToChildren).

Available options:

<table>
    <tr>
        <th>padding</th>
        <td><i>number</i></td>
        <td>Inflate the embedding parent element's calculated bounding box by this much additional padding.</td>
    </tr>
    <tr>
        <th>expandOnly</th>
        <td><i>boolean</i></td>
        <td>If <code>true</code>, the algorithm is only ever allowed to expand the bounding box of the embedding parent element, never to shrink it. You can visualize this setting as the algorithm dragging the top-left and bottom-right corners of the parent's bounding box <strong>outward</strong> until its children (including this element) are within the bounding box.</td>
    </tr>
    <tr>
        <th>shrinkOnly</th>
        <td><i>boolean</i></td>
        <td>
            <p>If <code>true</code>, the algorithm is only ever allowed to shrink the bounding box of the embedding parent element, never to expand it. You can visualize this setting as the algorithm dragging the top-left and bottom-right corners of the parent's bounding box <strong>inward</strong> until only its children (including this element) are within the bounding box.</p>
            <p>If only a portion of this element (or this element's sibling element) initially overlaps the embedding parent element, the parent's calculated bounding box will only include that portion. If there is no overlap between this element and its parent (i.e. this element is <q>outside</q> the parent), then this function does nothing (since satisfying the shrink-only restriction is impossible).</p>
        </td>
    </tr>
    <tr>
        <th>deep</th>
        <td><i>boolean</i></td>
        <td>
            <p>If <code>true</code>, this algorithm is applied recursively on the embedding parent element of this element's embedding parent element, and so on. The bounding box algorithm is evaluated in reverse-depth order - starting from this element, then going up (i.e. to the topmost embedding ancestor element - or <code>opt.terminator</code>), to make sure that any paddings applied on lower-level elements are taken into account by higher-level elements.</p>
            <p>Note that if this option is used in conjunction with <code>opt.shrinkOnly</code>, the algorithm is still applied strictly recursively (i.e. one level at a time). Therefore, even if this element lies completely within the current bounding box of its grandfather element, the grandfather element's calculated bounding box will shrink only based on this element's parent - which may mean that this element will end up outside of the calculated bounding box of the grandfather element.</p>
        </td>
    </tr>
    <tr>
        <th>terminator</th>
        <td><i>Cell&nbsp;|&nbsp;Cell.ID</i></td>
        <td>
            <p>If <code>opt.deep</code> is <code>true</code> and a Cell reference or a Cell ID is provided as a value of this option, then the specified element is the last one for which the bounding box algorithm is applied during recursion - it is the last element whose bounding box is resized and repositioned based on the bounding boxes of its children.</p>
            <p>Handling of edge cases:</p>
            <ul>
                <li>If the provided value refers to this element, then nothing happens.</li>
                <li>If the provided value refers to this element's embedding parent element, then the result is the same as calling the function without <code>opt.deep</code> and <code>opt.terminator</code>.</li>
                <li>If the provided value does not refer to an ancestor of this element, then the result is the same as calling the function without <code>opt.terminator</code>.</li>
                <li>If the provided value does not refer to a Cell of the Element type, then the result is the same as calling the function without <code>opt.terminator</code>.</li>
            </ul>
        </td>
    </tr>
</table>
