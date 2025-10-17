export { LayerDirectionEnum } from "@msagl/core";

/**
 * Edge routing strategy.
 * - Rectilinear: Orthogonal routing with right angles
 * - SplineBundling: Smooth curves - segments are sampled and converted to vertices
 */
export enum EdgeRoutingMode {
    /** Smooth curved edges sampled into points */
    SplineBundling = 1,
    /** Orthogonal edges using right-angled segments */
    Rectilinear = 4
}
