// Test script: runs the genogram layout in Node.js (no browser needed).
// Uses the same layoutGenogram() as the browser version — no duplication.
//
// Usage: cd examples/genogram-directed-graph-ts
//   yarn test-layout
//   yarn test-layout --data=thompson.json

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { dia, shapes } from '@joint/core';
import { getParentChildLinks, getMateLinks, type PersonNode } from '../src/data';
import { layoutGenogram } from '../src/layout';

// --- Parse CLI args ---
const dataFile = process.argv.find(a => a.startsWith('--data='))?.split('=')[1] || 'test.json';
const familiesDir = resolve(dirname(__filename), '../src/families');
const persons: PersonNode[] = JSON.parse(readFileSync(`${familiesDir}/${dataFile}`, 'utf-8'));

const personById = new Map<number, PersonNode>();
for (const p of persons) personById.set(p.id, p);

const parentChildLinks = getParentChildLinks(persons);
const mateLinks = getMateLinks(persons);

// --- Create elements and graph (use standard shapes — no SVG markup needed) ---
const sizes = { symbolWidth: 50, symbolHeight: 50, coupleGap: 20, symbolGap: 20, levelGap: 70 };

const graph = new dia.Graph({}, { cellNamespace: shapes });

const elements: dia.Element[] = persons.map((person) => {
    return new shapes.standard.Rectangle({
        id: String(person.id),
        size: { width: sizes.symbolWidth, height: sizes.symbolHeight },
    });
});

// --- Run layout (same code as browser) ---
console.log(`Data: ${dataFile} (${persons.length} persons, ${parentChildLinks.length} parent-child links, ${mateLinks.length} mate links)`);

layoutGenogram({ graph, elements, persons, parentChildLinks, mateLinks, sizes });

// --- Print results ---
console.log(`Graph after layout: ${graph.getElements().length} elements, ${graph.getLinks().length} links`);

const positionsByY = new Map<number, { label: string; x: number }[]>();
for (const el of graph.getElements()) {
    const pos = el.position();
    const y = Math.round(pos.y);
    const person = personById.get(Number(el.id));
    const label = person ? `${person.name}(${person.id})` : `??(${el.id})`;
    if (!positionsByY.has(y)) positionsByY.set(y, []);
    positionsByY.get(y)!.push({ label, x: Math.round(pos.x) });
}

console.log('\n=== Layout positions by generation (Y) ===');
for (const y of [...positionsByY.keys()].sort((a, b) => a - b)) {
    const row = positionsByY.get(y)!.sort((a, b) => a.x - b.x);
    console.log(`  y=${y}:`);
    for (const r of row) console.log(`    ${r.label} @ x=${r.x}`);
}

// --- Check for visual crossings at the container level ---
// Links from the same couple share a midpoint, so only container-to-container
// edges can visually cross. Deduplicate to unique (srcContainer, tgtContainer).
const mateOf = new Map<string, string>();
for (const ml of mateLinks) {
    mateOf.set(String(ml.from), String(ml.to));
    mateOf.set(String(ml.to), String(ml.from));
}
function coupleCenter(personId: string): number {
    const el = graph.getCell(personId) as dia.Element;
    const partnerId = mateOf.get(personId);
    if (partnerId) {
        const partnerEl = graph.getCell(partnerId) as dia.Element;
        if (partnerEl) return (el.getCenter().x + partnerEl.getCenter().x) / 2;
    }
    return el.getCenter().x;
}

// Build deduplicated container-level edges.
type ContainerEdge = { srcX: number; tgtX: number; srcY: number; tgtY: number; label: string };
const edgeMap = new Map<string, ContainerEdge>();
for (const rel of parentChildLinks) {
    const srcId = String(rel.parentId);
    const tgtId = String(rel.childId);
    const partnerId = mateOf.get(tgtId);
    // Container key: sort couple IDs for dedup.
    const tgtKey = partnerId ? [tgtId, partnerId].sort().join('|') : tgtId;
    const srcKey = mateOf.has(srcId) ? [srcId, mateOf.get(srcId)!].sort().join('|') : srcId;
    const edgeKey = `${srcKey}->${tgtKey}`;
    if (edgeMap.has(edgeKey)) continue;
    const srcEl = graph.getCell(srcId) as dia.Element;
    const tgtEl = graph.getCell(tgtId) as dia.Element;
    if (!srcEl || !tgtEl) continue;
    edgeMap.set(edgeKey, {
        srcX: coupleCenter(srcId),
        tgtX: coupleCenter(tgtId),
        srcY: srcEl.position().y,
        tgtY: tgtEl.position().y,
        label: edgeKey,
    });
}
const edges = [...edgeMap.values()];

let crossings = 0;
for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
        const ei = edges[i], ej = edges[j];
        if (Math.abs(ei.srcY - ej.srcY) > 10) continue;
        if (Math.abs(ei.tgtY - ej.tgtY) > 10) continue;
        if ((ei.srcX - ej.srcX) * (ei.tgtX - ej.tgtX) < 0) {
            console.log(`  CROSSING: ${ei.label} X ${ej.label}`);
            crossings++;
        }
    }
}

console.log(`\n=== Visual crossings: ${crossings} ===`);
if (crossings === 0) {
    console.log('OK: No visual crossings detected.');
} else {
    console.log(`FAIL: ${crossings} visual crossing(s) found.`);
    process.exit(1);
}
