import { useContext } from 'react';
import { PaperContext } from '@joint/react';
import Button from '@mui/material/Button';

export default function ZoomToFitButton() {
    const [paper] = useContext(PaperContext);
    const highlightElement = () => {
        if (!paper);
        paper.transformToFitContent({ verticalAlign: 'middle', horizontalAlign: 'middle', padding: 20 });
    }
    return (
        <Button onClick={highlightElement}>Zoom To Fit</Button>
    );
}
