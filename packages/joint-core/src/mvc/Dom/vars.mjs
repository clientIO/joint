import Data from '../Data.mjs';

export const dataPriv = new Data();

export const dataUser = new Data();

export function cleanNodesData(data, nodes) {
    let i = nodes.length;
    while (i--) {
        data.remove(nodes[i]);
    }
}
