// Every document that has adopted a stylesheet, and for each distinct CSS the
// sheet plus how many callers hold it. Two views sharing a stylesheet - a paper
// and its minimap - adopt the same sheet rather than one each, and it is
// dropped from the document once the last of them releases it.
const adoptedStylesheets = new WeakMap();

function entriesFor(ownerDocument) {
    let entries = adoptedStylesheets.get(ownerDocument);
    if (!entries) {
        entries = new Map();
        adoptedStylesheets.set(ownerDocument, entries);
    }
    return entries;
}

/**
 * Adopts `css` into `ownerDocument` as a constructed stylesheet, which the
 * `style-src` directive does not apply to, unlike a `<style>` element.
 * Adopting the same CSS into the same document again reuses the sheet.
 * Release it with {@link releaseStylesheet} when it is no longer needed.
 * @param {Document} ownerDocument the document to adopt the stylesheet into
 * @param {string} css
 * @returns {CSSStyleSheet|null} `null` when the document cannot adopt one.
 */
export function adoptStylesheet(ownerDocument, css) {
    const view = ownerDocument && ownerDocument.defaultView;
    // Constructed in the target document's own realm: a sheet built in another
    // cannot be adopted, which matters for a view inside an iframe.
    const SheetConstructor = view && view.CSSStyleSheet;
    if (!SheetConstructor || !ownerDocument.adoptedStyleSheets) return null;
    const entries = entriesFor(ownerDocument);
    const entry = entries.get(css);
    if (entry) {
        entry.count++;
        return entry.sheet;
    }
    let sheet;
    try {
        sheet = new SheetConstructor();
        // Throws on `@import`, which a `<style>` element would have allowed.
        sheet.replaceSync(css);
        // Reassigned rather than mutated in place: the list is only a mutable
        // array from Chrome 99 on, while `adoptedStyleSheets` arrived in 73.
        ownerDocument.adoptedStyleSheets = [...ownerDocument.adoptedStyleSheets, sheet];
    } catch {
        return null;
    }
    // Recorded only once the document holds it, so a failure leaves no entry
    // claiming a sheet that was never adopted.
    entries.set(css, { sheet, css, count: 1 });
    return sheet;
}

/**
 * Releases a sheet taken with {@link adoptStylesheet}. The document drops it
 * once every caller that adopted it has released it.
 * @param {Document} ownerDocument
 * @param {CSSStyleSheet} sheet
 */
export function releaseStylesheet(ownerDocument, sheet) {
    const entries = adoptedStylesheets.get(ownerDocument);
    if (!entries) return;
    for (const entry of entries.values()) {
        if (entry.sheet !== sheet) continue;
        if (--entry.count > 0) return;
        entries.delete(entry.css);
        ownerDocument.adoptedStyleSheets = [...ownerDocument.adoptedStyleSheets].filter(
            (adopted) => adopted !== sheet
        );
        return;
    }
}
