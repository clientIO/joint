// Regression test for `types` path patterns in package.json `exports`.
// - Compiled with `moduleResolution: "bundler"` to force checking `exports`.
// - Relies on self-reference behavior which applies when `exports` are present.
// - If either path pattern stops working, this file to fail to type-check.
export type { Graph as DiaGraphExtensionless } from '@joint/core/types/dia';
export type { Graph as DiaGraphExplicit } from '@joint/core/types/dia.d.ts';
