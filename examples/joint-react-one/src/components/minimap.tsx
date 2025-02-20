import { dia } from "@joint/core";
import { Paper } from "@joint/react";
import { CLIP_PATH_STYLE } from "../nodes/base-node";
import { compose } from "../compose";
import { LinkModel } from "../default-data";

export function MiniMap({ selectedId }: { selectedId?: dia.Cell.ID }) {
  return (
    <div className="border-t-2 border-primary border-dashed mt-2">
      <span className="text-xs text-white/30 mx-3 mb-0.5">Minimap</span>
      <Paper
        scale={0.26}
        height={200}
        interactive={false}
        className=""
        defaultLink={() => new LinkModel()}
        renderElement={(item) => (
          <rect
            fill={item.id === selectedId ? "bg-primary" : "#fff"}
            style={{
              ...CLIP_PATH_STYLE,
              width: item.width,
              height: item.height,
            }}
            className={compose(
              item.id === selectedId ? "bg-primary" : "bg-white"
            )}
          />
        )}
      />
    </div>
  );
}
