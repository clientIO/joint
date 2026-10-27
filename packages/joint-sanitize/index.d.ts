import type { dia } from '@joint/core';

/**
 * Returns the HTML string without the unsafe content (e.g. `<script>`, `onclick`, `javascript:` URLs).
 * - Only the allowed elements are kept; a disallowed element is replaced by its content
 *   (e.g. the text of an unknown element is kept), except `<script>` and `<template>` (their
 *   content is dropped) and an element whose text would be re-parsed as markup when inserted
 *   (e.g. a `<style>` containing `<tag`, removed to prevent mXSS). Comments containing
 *   markup are removed for the same reason.
 * - `id`/`name` values which would clobber a property of `document` are removed.
 * - Attributes which would let the content act on the host document are removed: `form` and
 *   the `form*` overrides of submit buttons, `command` and `commandfor`; the value of `is`
 *   (customized built-in elements) is emptied.
 * - CSS is kept (`<style>` elements and `style` attributes), as are external `http(s)` URLs
 *   (images, links, form actions).
 * - Insert the result only as the content of an HTML element (e.g. `el.innerHTML = result`),
 *   not into an SVG element, a raw-text element or an attribute.
 * - It requires a DOM.
 */
export function sanitizeHTML(html: string): string;

export interface SanitizeJSONOptions {
    /**
     * The namespace of the cell constructors (the same as the `cellNamespace` of the graph).
     * It is used to find the markup and the defaults of the cells.
     * Without it (or for an unknown `type`), the shape markup and defaults are not known:
     * the selectors of JSON markup present in the cell JSON are still resolved against it, but
     * every other selector gets the rules of all elements (e.g. `data:image/svg+xml` URLs are
     * removed). Use the same namespace the graph uses: with a wrong or missing namespace, the
     * legitimate content of custom shapes can be removed (e.g. a `data:image/svg+xml` icon of a
     * selector which the shape markup renders as `<image>`, or an `id` which is a property of
     * `document`), because the selector can no longer be resolved to its element.
     */
    cellNamespace?: object;
    /**
     * Called for every removed part of the JSON (in lenient mode, also for a string markup or
     * `html` attribute whose unsafe content was removed, even though the property itself is kept).
     * It is not called when a value is only normalized (e.g. `&` escaped, string markup re-serialized).
     * The path is of the nearest named property, not the position inside nested markup or values
     * (e.g. `['cells', 0, 'markup']` for an element removed from the markup).
     */
    onRemove?: (path: Array<string | number>, reason: string) => void;
    /**
     * `true` (the default) removes string markup and the `html` attribute.
     * `false` (lenient mode) sanitizes them instead: string markup is parsed and sanitized,
     * the `html` attribute is allowed on the HTML elements of JSON markup whose content
     * is parsed as the content of `<div>` (e.g. `<div>` or `<span>` in `<foreignObject>`).
     * Lenient mode requires a DOM (otherwise they are removed).
     * @default true
     */
    strict?: boolean;
}

/**
 * Returns a sanitized copy of graph JSON from an untrusted source (e.g. a file import),
 * to be loaded by `graph.fromJSON()`.
 *
 * The graph JSON is rendered as it is: JSON from an untrusted source can run scripts
 * unless it is sanitized. Sanitize every way it enters the graph:
 * - `graph.fromJSON()` - `sanitizeGraphJSON()`,
 * - `graph.addCell()`, `graph.addCells()`, `graph.resetCells()`, `graph.syncCells()`,
 *   `new Shape(attributes)` - `sanitizeCellJSON()` (for each cell; `sanitizeCellAttributes()`
 *   for the cells `graph.syncCells()` updates),
 * - `cell.set()` - `sanitizeCellAttributes()`,
 * - `cell.prop()`, `cell.attr()` and any other method which changes the markup, the attributes,
 *   the ports or the labels of a cell (e.g. `element.addPort()`, `element.insertPort()`,
 *   `link.appendLabel()`, `link.label()`) - apply the change to a copy of the top-level
 *   attribute, see `sanitizeCellAttributes()`.
 *
 * - Removes disallowed elements (e.g. `<script>`, `<animate>`, `<set>`, MathML, HTML outside
 *   `<foreignObject>`), unsafe attributes (e.g. `onclick` and any `on*` name, `javascript:`/`vbscript:`
 *   URLs, `srcdoc`, `data:` URLs other than images on image elements, `form` and the `form*`
 *   overrides of submit buttons, `is`, `command`, `commandfor`), string markup and the
 *   `html` attribute (see the `strict` option).
 * - Removes the cells, the markup, the attributes, the ports and the port groups which
 *   are not of the expected type (e.g. `cells` which are not an array; `graph.fromJSON()`
 *   then throws if `cells` is removed).
 * - Removes the label markup of a port whose group also defines a label markup (JSON markup
 *   would be merged with it node by node); the group label markup is used. Define the
 *   label markup either on the group or on its ports.
 * - Only `cells` are sanitized; `layers` and other graph attributes are copied unchanged
 *   (JointJS does not render them).
 * - The markup and the defaults defined by the shapes themselves are trusted. The markup
 *   set by a shape on its instances (e.g. in `preinitialize()`) is not known (the rules
 *   of all elements apply).
 * - The `attrs` get the rules of the elements they apply to only through the `selector`s of the
 *   JSON markup which renders them (the markup of the cell, of the port and its label, of the link
 *   label). The rules of all elements apply to everything else: group selectors (`groupSelector`),
 *   the root selectors (`root`, `portRoot`, `labelRoot`, `labelText`) unless the markup defines
 *   them, CSS selectors, the `attrs` of a port group and of the default label of a link (templates
 *   merged into every port/label), and the content of markers, gradients and patterns (merged with
 *   other definitions). The rules of all elements remove only a few more values: `data:image/svg+xml`
 *   URLs (raster `data:image/*` URLs are kept), `id`/`name` values which are a property of
 *   `document`, and the `html` attribute (lenient mode). Set such values on the markup node
 *   (`attributes`) or through a `selector` of the markup instead.
 * - `name` on `<img>`/`<form>` and `id` on `<img>` (and on any element where the rules of all
 *   elements apply) are removed when the value is a property of `document`; without a DOM
 *   (e.g. in Node.js) they are always removed.
 * - Not checked: what custom attribute definitions, custom views and `props`/`text` values do with
 *   the values, selectors which do not exist (e.g. `ref`, they throw when rendered as before),
 *   external `http(s)` resources, CSS (e.g. `<style>` can change the look of the whole page), and
 *   a `cellNamespace` which differs from the graph's.
 * - Custom attribute definitions (`attributes` of a shape, `dia.attributes`) are not checked: the
 *   values are checked as attributes of the name they are set under. A definition must therefore
 *   apply the values only as attribute values or properties, never as markup, i.e. never build
 *   a markup string from them (e.g. for `V(markup)`, `innerHTML` or `util.template()`):
 * ```js
 * const Shape = dia.Element.define('app.Shape', {}, {}, {
 *     attributes: {
 *         'stripe-color': {
 *             set: function(color) {
 *                 // Unsafe: V(`<pattern><rect fill="${color}"/></pattern>`)
 *                 // Safe: the value is an attribute value, it can not inject markup.
 *                 const pattern = V('pattern', { width: 10, height: 10, patternUnits: 'userSpaceOnUse' }, [
 *                     V('rect', { width: 5, height: 10, fill: color })
 *                 ]);
 *                 pattern.appendTo(this.paper.defs);
 *                 return { fill: `url(#${pattern.id})` };
 *             }
 *         }
 *     }
 * });
 * ```
 * - For `graph.syncCells()`: use `sanitizeCellAttributes(graph.getCell(id), init)` when the cell
 *   exists and `init.type` is missing or equal to its type, otherwise `sanitizeCellJSON(init)`.
 * - Returns `null` if the JSON is not an object.
 * - Throws on JSON which is nested too deeply to copy (such JSON overflows the stack when it is
 *   rendered too). Wrap the call in `try`/`catch` if the input can not be trusted to be shallow.
 */
export function sanitizeGraphJSON<T = unknown>(json: T, opt?: SanitizeJSONOptions): T | null;

/**
 * Returns a sanitized copy of cell JSON from an untrusted source (e.g. to be added by `graph.addCell()`).
 * Returns `null` if the JSON is not an object (e.g. an array of cells).
 * See `sanitizeGraphJSON()`.
 */
export function sanitizeCellJSON<T = unknown>(json: T, opt?: SanitizeJSONOptions): T | null;

/**
 * Returns a sanitized copy of attributes from an untrusted source, which are about
 * to be set on an existing cell by `cell.set()` (e.g. in a collaborative session).
 * A markup (`markup`, `portMarkup`, `portLabelMarkup`, `labelMarkup`, `defaultLabel`) which
 * would make the existing attributes of the cell unsafe is removed (the other attributes are
 * still returned). Pass the returned object to `cell.set()` as it is (do not merge the
 * unsanitized input back in).
 * Without a cell (`null`), the attributes are sanitized as the attributes of an unknown cell.
 * Returns an empty object if the attributes are not an object.
 *
 * A path-based change (e.g. `cell.prop('ports/items/0/markup', markup)` or
 * `cell.attr('body/fill', fill)`) can not be sanitized on its own. Apply it
 * to a copy of the top-level attribute, then sanitize and set that:
 * ```js
 * const attrs = util.cloneDeep(cell.get('attrs'));
 * util.setByPath(attrs, 'body/fill', fill);
 * cell.set(sanitizeCellAttributes(cell, { attrs }));
 * // the same pattern for ports, labels, markup, ...
 * const ports = util.cloneDeep(cell.get('ports'));
 * ports.items[0].markup = markup;
 * cell.set(sanitizeCellAttributes(cell, { ports }));
 * ```
 * See `sanitizeGraphJSON()`.
 */
export function sanitizeCellAttributes<T = unknown>(cell: dia.Cell | null, attributes: T, opt?: Pick<SanitizeJSONOptions, 'onRemove' | 'strict'>): T;
