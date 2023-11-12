import { useGraph } from '@joint/react';
import Button from '@mui/material/Button';

export default function CloneButton({ children, cells, offset = 20, onClone, ...buttonProps }) {
    const graph = useGraph();
    const deleteElement = () => {
        if (!graph) return;
        const clones = Object.values(graph.cloneCells(cells));
        clones.forEach(clone => !clone.isEmbedded() && clone.translate(offset, offset));
        graph.addCells(clones);
        onClone && onClone(clones);
    }
    return (
        <Button {...buttonProps} onClick={deleteElement}>{ children }</Button>
    );
}
