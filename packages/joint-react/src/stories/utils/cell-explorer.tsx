/**
 * This is used only for storybook stories. Internally.
 */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import type { dia } from '@joint/core';

interface CellExplorerProps {
  readonly cell: dia.Cell.JSON;
  readonly onChange?: (cell: dia.Cell.JSON) => void;
}

interface Props {
  readonly keyName: string;
  readonly parentKey?: string;
  readonly value: unknown;
  readonly onChange: (newValue: unknown) => void;
}
const MARGIN = '8px';
function EditableField({ keyName, parentKey, value, onChange }: Props) {
  const handleChange = (key: string, newValue: unknown) => {
    if (typeof value === 'object' && value !== null) {
      onChange({ ...value, [key]: newValue });
    } else {
      onChange(newValue);
    }
  };

  const parseValue = (inputValue: string) => {
    if (typeof value === 'number') {
      return Number.isNaN(Number(inputValue)) ? value : Number(inputValue);
    }
    return inputValue;
  };

  if (typeof value === 'object' && value !== null) {
    return (
      <div style={{ marginBottom: MARGIN }}>
        <div>
          {Object.entries(value).map(([key, value_]) => (
            <EditableField
              key={key}
              keyName={key}
              parentKey={parentKey ? `${parentKey}.${keyName}` : keyName}
              value={value_}
              onChange={(newValue) => handleChange(key, newValue)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: MARGIN }}>
      <label style={{ fontWeight: 'bold', marginRight: MARGIN }}>
        {parentKey ? `${parentKey}.${keyName}` : keyName}:{' '}
      </label>
      <input
        type="text"
        value={String(value)}
        onChange={(event) => onChange(parseValue(event.target.value))}
        style={{ marginLeft: MARGIN }}
      />
    </div>
  );
}

function CellExplorer({ cell, onChange }: CellExplorerProps) {
  const handleInputChange = (key: string, value: unknown) => {
    if (onChange) {
      onChange({ ...cell, [key]: value });
    }
  };

  return (
    <div style={{ border: '1px solid #ddd', padding: MARGIN, margin: '4px' }}>
      <h4>Cell ID: {cell.id}</h4>
      {Object.entries(cell).map(([key, value]) => {
        return (
          <EditableField
            key={key}
            keyName={key}
            value={value}
            onChange={(newValue) => handleInputChange(key, newValue)}
          />
        );
      })}
    </div>
  );
}

interface CellsExplorerProps {
  readonly elements: dia.Cell.JSON[];
  readonly onChange: (cells: dia.Cell.JSON[]) => void;
}

function CellsExplorer({ elements: cells, onChange }: CellsExplorerProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
      {cells.map((cell) => {
        if (!cell) {
          return null;
        }
        return (
          <CellExplorer
            key={cell.id}
            cell={cell}
            onChange={(newCell) => {
              const updatedCells = cells.map((c) => {
                if (!c) {
                  return c;
                }
                if (c.id === newCell.id) {
                  return newCell;
                }
                return c;
              });
              onChange(updatedCells);
            }}
          />
        );
      })}
    </div>
  );
}

export { CellExplorer, CellsExplorer };
