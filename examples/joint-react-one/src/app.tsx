/* eslint-disable react-refresh/only-export-components */
import {
  GraphProvider,
  Paper,
  RenderElement,
  useElementEffect,
  useElements,
} from "@joint/react";
import { dia } from "@joint/core";
import { ToolBar } from "./components/toolbar";
import { useCallback, useState } from "react";
import { Element } from "./types";
import { AlertNode } from "./nodes/alert-node";
import { ElementsExplorer } from "./components/elements-explorer";
import backgroundImage from "./assets/bg.svg";
import { NoDataPlaceholder } from "./components/no-data-placeholder";
import { TableNode } from "./nodes/table-node";
import {
  defaultElements,
  defaultLinks,
  LinkModel,
  PRIMARY_COLOR,
  SECONDARY_COLOR,
} from "./default-data";

function App() {
  const [selectedNodeId, setSelectedNodeId] = useState<dia.Cell.ID | undefined>(
    1
  );
  const [isMinimapEnabled, setIsMinimapEnabled] = useState(true);

  const nonReactElementsIds = useElements((items) =>
    items.filter((item) => item.get("type") !== "react").map((item) => item.id)
  );

  useElementEffect(
    nonReactElementsIds,
    (element) => {
      const isSelected = element.id === selectedNodeId;
      const dynamicColor = isSelected ? PRIMARY_COLOR : "white";
      element.attr({
        body: {
          fill: SECONDARY_COLOR,
          stroke: dynamicColor,
          strokeWidth: 2,
        },
        label: {
          text: "Native element",
          stroke: dynamicColor,
          fill: dynamicColor,
          fontSize: 18,
          fontWeight: "bold",
        },
      });
    },
    [selectedNodeId]
  );

  const renderMainElement: RenderElement<Element> = useCallback(
    (item) => {
      switch (item.componentType) {
        case "alert":
          return (
            <AlertNode
              isSelected={selectedNodeId === item.id}
              pressValue={item.id}
              onClick={setSelectedNodeId}
              {...item}
            />
          );

        case "table":
          return (
            <TableNode
              isSelected={selectedNodeId === item.id}
              pressValue={item.id}
              onClick={setSelectedNodeId}
              {...item}
            />
          );
      }
    },
    [selectedNodeId]
  );

  return (
    <div className="w-full h-full absolute flex flex-col top-0 left-0 bg-primaryText">
      <img
        src={backgroundImage}
        alt="background"
        className="absolute top-0 left-0 w-full h-full object-cover opacity-40 pointer-events-none"
      />
      <div className="ml-3 mt-2 mb-1 flex items-center font-bold text-white text-lg">
        JointJS React
      </div>

      <ToolBar
        isMinimapEnabled={isMinimapEnabled}
        setIsMinimapEnabled={setIsMinimapEnabled}
        setSelectedId={setSelectedNodeId}
        selectedId={selectedNodeId}
      />
      <div className="flex flex-1 flex-row overflow-hidden">
        <Paper<Element>
          className="bg-primaryText border-r-2 border-primary border-dashed"
          elementSelector={(cell) => {
            return {
              componentType: cell.get("componentType"),
              id: cell.id,
              data: cell.attributes.data,
            };
          }}
          width={"100%"}
          height={"100%"}
          defaultLink={() => new LinkModel()}
          linkPinning={false}
          noDataPlaceholder={
            <NoDataPlaceholder setSelectedId={setSelectedNodeId} />
          }
          renderElement={renderMainElement}
        />

        <ElementsExplorer
          isMinimapEnabled={isMinimapEnabled}
          setIsMinimapEnabled={setIsMinimapEnabled}
          setSelectedId={setSelectedNodeId}
          selectedId={selectedNodeId}
        />
      </div>
    </div>
  );
}

export default () => (
  <GraphProvider defaultElements={defaultElements} defaultLinks={defaultLinks}>
    <App />
  </GraphProvider>
);
