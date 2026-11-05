'use strict';

const { expect } = require('chai');
const joint = require('@joint/core');
const jointSanitize = require('../../dist/sanitize.js');

describe('sanitizeGraphJSON()', () => {
    const XHTML = 'http://www.w3.org/1999/xhtml';

    it('should remove the unsafe parts without a DOM', () => {
        expect(typeof document).to.equal('undefined');
        const removed = [];
        const json = jointSanitize.sanitizeGraphJSON({
            cells: [{
                id: 'c1', type: 'standard.Rectangle',
                markup: [{ tagName: 'script', namespaceURI: XHTML, children: ['x'] }, { tagName: 'rect', selector: 'body' }]
            }, {
                id: 'c2', type: 'standard.Rectangle',
                attrs: { body: { onclick: 'x', fill: 'red' }, label: { text: 'x', html: '<b>x</b>' }}
            }, {
                id: 'c3', type: 'standard.Rectangle',
                markup: [{ tagName: 'foreignObject', children: [
                    { tagName: 'iframe', namespaceURI: XHTML, attributes: { srcdoc: 'x' }},
                    // without a document, any name could replace a property of it
                    { tagName: 'img', namespaceURI: XHTML, attributes: { name: 'photo', id: 'photo', alt: 'x' }}
                ] }]
            }, {
                id: 'c4', type: 'standard.Rectangle', markup: '<script/>'
            }]
        }, { cellNamespace: joint.shapes, onRemove: (path) => removed.push(path.join('/')) });
        expect(json.cells[0].markup).to.deep.equal([{ tagName: 'rect', selector: 'body' }]);
        expect(json.cells[1].attrs).to.deep.equal({ body: { fill: 'red' }, label: { text: 'x' }});
        expect(json.cells[2].markup[0].children).to.deep.equal([
            { tagName: 'img', namespaceURI: XHTML, attributes: { alt: 'x' }}
        ]);
        expect(json.cells[3]).to.not.have.property('markup');
        expect(removed.sort()).to.deep.equal([
            'cells/0/markup',
            'cells/1/attrs/body/onclick',
            'cells/1/attrs/label/html',
            'cells/2/markup',
            'cells/2/markup/attributes/id',
            'cells/2/markup/attributes/name',
            'cells/3/markup'
        ]);
    });

    it('should check all the names an attribute can be set with (without `V`)', () => {
        const { attrs, markup } = jointSanitize.sanitizeCellJSON({
            type: 'standard.Rectangle',
            markup: [{ tagName: 'a', selector: 'link', attributes: { xlinkHref: 'javascript:x', title: 'x' }}],
            attrs: { link: { xlinkHref: 'javascript:x', onClick: 'x', fill: 'red' }}
        }, { cellNamespace: joint.shapes });
        expect(markup[0].attributes).to.deep.equal({ title: 'x' });
        expect(attrs.link).to.deep.equal({ fill: 'red' });
        // `xlinkHref` is mapped to `xlink:href`, so `data:` URLs are checked as URLs
        const { attrs: useAttrs } = jointSanitize.sanitizeCellJSON({
            type: 'standard.Rectangle',
            markup: [{ tagName: 'use', selector: 'use' }],
            attrs: { use: { xlinkHref: 'data:image/png;base64,AAAA' }}
        }, { cellNamespace: joint.shapes });
        expect(useAttrs.use).to.deep.equal({});
    });

    it('should remove string markup and the `html` attribute in lenient mode without a DOM', () => {
        const removed = [];
        const json = jointSanitize.sanitizeCellJSON({
            type: 'standard.Rectangle',
            markup: [{ tagName: 'foreignObject', children: [{ tagName: 'div', namespaceURI: XHTML, selector: 'div' }] }],
            portMarkup: '<circle/>',
            attrs: { div: { html: '<b>x</b>' }}
        }, { cellNamespace: joint.shapes, strict: false, onRemove: (path, reason) => removed.push(path.join('/') + ': ' + reason) });
        expect(json).to.not.have.property('portMarkup');
        expect(json.attrs.div).to.deep.equal({});
        expect(removed).to.deep.equal([
            'portMarkup: string markup requires a DOM',
            'attrs/div/html: the `html` attribute requires a DOM'
        ]);
    });

    it('should allow `data:` images only on elements which display them', () => {
        const png = 'data:image/png;base64,AAAA';
        const { markup } = jointSanitize.sanitizeCellJSON({
            type: 'standard.Rectangle',
            markup: [{ tagName: 'image', attributes: { href: png }}, { tagName: 'a', attributes: { href: png, title: 'javascript: a language' }}]
        }, { cellNamespace: joint.shapes });
        expect(markup[0].attributes).to.deep.equal({ href: png });
        expect(markup[1].attributes).to.deep.equal({ title: 'javascript: a language' });
    });

    it('should remove the values of an unexpected type', () => {
        const removed = [];
        const onRemove = (path) => removed.push(path.join('/'));
        const cell = { id: 'a', type: 'standard.Rectangle', markup: [{ tagName: 'script' }] };
        expect(jointSanitize.sanitizeGraphJSON({ cells: { length: 1, 0: cell }}, { onRemove })).to.deep.equal({});
        const json = jointSanitize.sanitizeGraphJSON(JSON.parse(`{ "__proto__": { "cells": [${JSON.stringify(cell)}] }}`), { onRemove });
        expect(json.cells).to.be.undefined;
        const { attrs, markup, ports } = jointSanitize.sanitizeCellJSON({
            type: 'standard.Rectangle',
            markup: [{ tagName: 'rect', selector: '0' }],
            attrs: [{ onclick: 'x' }],
            ports: { groups: [{ markup: [{ tagName: 'script' }] }], items: [{ id: 'p', markup: { length: 1, 0: { tagName: 'script' }}}] }
        }, { cellNamespace: joint.shapes, onRemove });
        expect(attrs).to.be.undefined;
        expect(markup).to.deep.equal([{ tagName: 'rect', selector: '0' }]);
        expect(ports).to.deep.equal({ items: [{ id: 'p' }] });
        expect(jointSanitize.sanitizeCellJSON([cell], { onRemove })).to.be.null;
        expect(removed).to.deep.equal(['cells', '__proto__', 'attrs', 'ports/groups', 'ports/items/0/markup', '']);
    });

    it('should remove markup without allowed elements', () => {
        const { markup, ports } = jointSanitize.sanitizeCellJSON({
            type: 'standard.Rectangle',
            markup: [{ tagName: 'script' }],
            ports: { items: [{ id: 'p', label: { markup: [{ tagName: 'script' }] }}] }
        }, { cellNamespace: joint.shapes });
        expect(markup).to.be.undefined;
        expect(ports.items[0]).to.deep.equal({ id: 'p', label: {}});
    });

    it('should sanitize the attributes of an existing cell without a DOM', () => {
        const cell = new joint.shapes.standard.Rectangle({ markup: [{ tagName: 'use', selector: 'body' }] });
        expect(jointSanitize.sanitizeCellAttributes(cell, {
            attrs: { body: { href: 'data:image/svg+xml,<svg/>', onclick: 'x', fill: 'red' }}
        })).to.deep.equal({ attrs: { body: { fill: 'red' }}});
        // `<form>` names could replace a property of the document
        const { markup } = jointSanitize.sanitizeCellJSON({
            type: 'standard.Rectangle',
            markup: [{ tagName: 'foreignObject', children: [{ tagName: 'form', namespaceURI: XHTML, attributes: { name: 'cookie', action: 'javascript:x' }}] }]
        }, { cellNamespace: joint.shapes });
        expect(markup[0].children[0].attributes).to.deep.equal({});
    });

    describe('the work is linear in the size of the JSON', () => {
        // (each of these took from seconds to minutes when the work was quadratic)
        const N = 8000;
        const markup = Array.from({ length: N }, (_, i) => ({ tagName: ['rect', 'image', 'use'][i % 3], selector: `s${i}`, groupSelector: 'group' }));
        const sanitize = (json) => jointSanitize.sanitizeGraphJSON(json, { cellNamespace: joint.shapes });

        it('should sanitize many ports which share a markup', function() {
            this.timeout(2000);
            const items = Array.from({ length: N }, (_, i) => ({ id: `p${i}`, attrs: { s1: { fill: 'red' }}}));
            sanitize({ cells: [{ type: 'standard.Rectangle', portMarkup: markup, ports: { items }}] });
            // (ports with their own markup, which share the label markup)
            const ownItems = Array.from({ length: N }, (_, i) => ({ id: `p${i}`, group: 'g', markup: [{ tagName: 'circle', selector: 'c' }], attrs: { s1: { fill: 'red' }}}));
            const groupAttrs = Object.fromEntries(Array.from({ length: N }, (_, i) => [`s${i}`, { fill: 'red' }]));
            sanitize({ cells: [{ type: 'standard.Rectangle', portLabelMarkup: markup, ports: { groups: { g: { attrs: groupAttrs }}, items: ownItems }}] });
        });

        it('should sanitize many labels which share a markup', function() {
            this.timeout(2000);
            const labels = Array.from({ length: N }, () => ({ attrs: { s1: { fill: 'red' }}}));
            sanitize({ cells: [{ type: 'standard.Link', labelMarkup: markup, labels }] });
        });

        it('should sanitize many attributes of a selector of many elements', function() {
            this.timeout(2000);
            const attrs = Object.fromEntries(Array.from({ length: N }, (_, i) => [`a${i}`, 'data:image/png;base64,AAAA']));
            // (a selector must be unique, but the JSON can repeat it)
            const sameMarkup = markup.map((node) => ({ tagName: node.tagName, selector: 'same' }));
            sanitize({ cells: [{ type: 'standard.Rectangle', markup: sameMarkup, attrs: { same: attrs }}] });
            sanitize({ cells: [{ type: 'standard.Rectangle', markup, attrs: { group: attrs }}] });
        });

        it('should sanitize deeply nested values', function() {
            this.timeout(2000);
            // (depth is bounded by the Node stack, width multiplies the (former) quadratic cost)
            let value = 'x';
            for (let i = 0; i < 1000; i++) value = { [`k${i}`]: value, [`l${i}`]: 'y' };
            const attrs = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`v${i}`, value]));
            const { cells } = sanitize({ cells: [{ type: 'standard.Rectangle', markup, attrs: { group: attrs }}] });
            expect(cells[0].attrs.group).to.deep.equal(attrs);
        });
    });

    it('should not change the built-in shapes', () => {
        Object.keys(joint.shapes.standard).forEach((name) => {
            const cellJSON = new joint.shapes.standard[name]({ ports: { items: [{ id: 'port' }] }}).toJSON();
            const removed = [];
            const sanitized = jointSanitize.sanitizeCellJSON(cellJSON, { cellNamespace: joint.shapes, onRemove: (path) => removed.push(path) });
            expect(sanitized, name).to.deep.equal(cellJSON);
            expect(removed, name).to.be.empty;
        });
    });
});
