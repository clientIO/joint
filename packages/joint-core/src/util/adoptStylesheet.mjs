// Every document that has adopted a stylesheet through `adoptStylesheet()`, and
// the sheet adopted for each distinct CSS. Two views sharing a stylesheet - a
// paper and its minimap - adopt the same sheet rather than one each.
const adoptedStylesheets = new WeakMap();

/**
 * Adopts `css` into `ownerDocument` as a constructed stylesheet, which the
 * `style-src` directive does not apply to, unlike a `<style>` element.
 * Adopting the same CSS into the same document again reuses the sheet.
 * @param {Document} ownerDocument the document to adopt the stylesheet into
 * @param {string} css
 * @returns {boolean} `false` when the document cannot adopt one, so the caller
 * can fall back to a `<style>` element.
 */
export function adoptStylesheet(ownerDocument, css) {
    const view = ownerDocument && ownerDocument.defaultView;
    // Constructed in the target document's own realm: a sheet built in another
    // cannot be adopted, which matters for a view inside an iframe.
    const SheetConstructor = view && view.CSSStyleSheet;
    if (!SheetConstructor || !ownerDocument.adoptedStyleSheets) return false;
    let sheetsByCSS = adoptedStylesheets.get(ownerDocument);
    if (!sheetsByCSS) {
        sheetsByCSS = new Map();
        adoptedStylesheets.set(ownerDocument, sheetsByCSS);
    }
    if (sheetsByCSS.has(css)) return true;
    let sheet;
    try {
        sheet = new SheetConstructor();
        // Throws on `@import`, which a `<style>` element would have allowed.
        sheet.replaceSync(css);
    } catch {
        return false;
    }
    sheetsByCSS.set(css, sheet);
    // Reassigned rather than mutated in place: the list is only a mutable array
    // from Chrome 99 on, while `adoptedStyleSheets` itself arrived in 73.
    ownerDocument.adoptedStyleSheets = [...ownerDocument.adoptedStyleSheets, sheet];
    return true;
}
