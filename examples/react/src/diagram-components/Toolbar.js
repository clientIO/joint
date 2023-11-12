import { ButtonGroup, Button } from "@mui/material";
import CloneButton from "./CloneButton";
import ZoomToFitButton from "./ZoomToFitButton";

export default function Toolbar({ children, selection, setSelection }) {
    return (
        <ButtonGroup
            variant="text"
            aria-label="duplicate selection and zoom to fit"
            sx={{ margin: "10px" }}
        >
            <CloneButton
                cells={selection}
                disabled={
                    selection.length === 0 ||
                    selection.every((cell) => cell.isLink())
                }
                onClone={(clones) => setSelection(clones)}
            >
                Duplicate Selection
            </CloneButton>
            <Button
                disabled={selection.length === 0}
                onClick={() => {
                    selection.forEach((cell) => cell.remove());
                    setSelection([]);
                }}
            >
                Delete Selection
            </Button>
            <ZoomToFitButton />
            {children}
        </ButtonGroup>
    );
}
