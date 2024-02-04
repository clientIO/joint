// JointJS
import { dia, shapes } from "@joint/core";
import { ElementModel, LinkModel } from "./models";
import { addGraphContent } from "./data/example";
// React
import { GraphProvider, PaperProvider, Paper } from "@joint/react";
import { MyBox, MyForm, MyRating, MyTable } from "./sample-components";
import { Selection } from "./diagram-components";
import Toolbar from "./diagram-components/Toolbar";
import { useState } from "react";
// MUI
import { Typography, Button } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
// CSS
import "./App.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

const darkTheme = createTheme({
    palette: {
        mode: "dark",
    },
});

const cellNamespace = {
    ...shapes,
    ElementModel,
    LinkModel,
};

// Render the React component inside the JointJS shape based on the `componentType` property
const renderElement = (element) => {
    switch (element.get("componentType")) {
        case MyForm.name: {
            const { label, severity, value = "" } = element.getData();
            return (
                <MyForm
                    label={label}
                    severity={severity}
                    value={value}
                    onChange={(e) => element.setData("value", e.target.value)}
                />
            );
        }
        case MyRating.name: {
            const { value = 0 } = element.getData();
            return (
                <MyRating
                    value={value}
                    onChange={(e) =>
                        element.setData("value", Number(e.target.value))
                    }
                />
            );
        }
        case MyTable.name:
            return <MyTable />;
        default:
            return null;
    }
};

// Render a simplified React component inside the JointJS shape
const renderSimpleElement = (element) => {
    const { value } = element.getData();
    return (
        <MyBox>
            <span style={{ fontSize: "2.5rem" }}>{value}</span>
        </MyBox>
    );
};

const graph = new dia.Graph({}, { cellNamespace: cellNamespace });
addGraphContent(graph);

// For testing purposes
// window.graph = graph;
// graph.on('change', (cell) => console.log(cell.changed));

const paperOptions = {
    height: 500,
    clickThreshold: 10,
    cellViewNamespace: cellNamespace,
    linkPinning: false,
    background: { color: "#212831" },
    defaultLink: () => new LinkModel(),
    validateConnection: (
        cellViewS,
        magnetS,
        cellViewT,
        magnetT,
        end,
        linkView
    ) => {
        return cellViewS !== cellViewT;
    },
};

const minimapOptions = {
    width: 300,
    height: 200,
    background: { color: "#1A2027" },
    interactive: false,
    cellViewNamespace: cellNamespace,
};

function App() {
    const [selection, setSelection] = useState([]);
    const [minimap, toggleMinimap] = useState(true);

    const onPaperEvent = (paper, eventName, ...eventArgs) => {
        switch (eventName) {
            case "cell:pointerclick": {
                const [elementView] = eventArgs;
                setSelection([elementView.model]);
                break;
            }
            case "blank:pointerclick": {
                setSelection([]);
                break;
            }
            default: {
                // no-op
                break;
            }
        }
    };

    const onMinimapEvent = (paper, eventName, ...eventArgs) => {
        if (eventName === "render:done") {
            const { model: graph } = paper;
            paper.transformToFitContent({
                // Do not take the links into account
                // when calculating the content area
                contentArea: graph.getCellsBBox(graph.getElements()),
                verticalAlign: "middle",
                horizontalAlign: "middle",
                padding: 20,
            });
        }
    };

    return (
        <>
            <ThemeProvider theme={darkTheme}>
                <CssBaseline />
                <div className="App">
                    <Typography variant="h2">React + JointJS</Typography>
                    <GraphProvider graph={graph}>
                        <PaperProvider>
                            <Toolbar
                                selection={selection}
                                setSelection={setSelection}
                            >
                                <Button
                                    onClick={() => toggleMinimap(!minimap)}
                                    variant={minimap ? "contained" : "text"}
                                >
                                    Minimap
                                </Button>
                            </Toolbar>
                            <Paper
                                renderElement={renderElement}
                                onEvent={onPaperEvent}
                                options={paperOptions}
                            >
                                <Selection cells={selection} color="#C595D4" />
                            </Paper>
                        </PaperProvider>
                        {minimap && (
                            <Paper
                                renderElement={renderSimpleElement}
                                onEvent={onMinimapEvent}
                                options={minimapOptions}
                                style={{
                                    boxSizing: "content-box",
                                    position: "absolute",
                                    right: 10,
                                    top: 410,
                                    border: "3px solid white",
                                }}
                            ></Paper>
                        )}
                    </GraphProvider>
                </div>
            </ThemeProvider>
        </>
    );
}

export default App;
