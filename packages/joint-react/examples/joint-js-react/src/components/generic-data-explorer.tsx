import { memo } from 'react'

interface GenericDataProps {
  data: Record<string, unknown>
  setData: (data: Record<string, unknown>) => void
}
function Component(props: GenericDataProps) {
  const { setData } = props
  const data = { ...props.data }
  const handleChange = (key: string, newValue: unknown) => {
    setData({ ...data, [key]: newValue })
  }

  return (
    <div className="flex flex-col my-2">
      {Object.entries(data).map(([key, value]) => {
        if (typeof value === 'boolean') {
          return (
            <div key={key} className="flex items-center gap-2 ml-2 mb-1">
              <label className="text-primaryText/60 text-sm flex-1">{key}</label>
              <input
                type="checkbox"
                checked={value}
                className="form-checkbox h-5 w-5"
                onChange={(e) => handleChange(key, e.target.checked)}
              />
            </div>
          )
        }

        if (typeof value === 'string' || typeof value === 'number') {
          return (
            <div key={key} className="flex flex-col ml-2 mb-1">
              <label className="text-primaryText/60 text-sm mb-1">{key}</label>
              <input
                type={typeof value === 'number' ? 'number' : 'text'}
                value={String(value)}
                className="input input-bordered w-full max-w-xs h-8"
                onChange={(e) =>
                  handleChange(
                    key,
                    typeof value === 'number' ? Number(e.target.value) : e.target.value
                  )
                }
              />
            </div>
          )
        }

        if (Array.isArray(value)) {
          return (
            <div key={key} className="flex flex-col ml-2 mb-1 border p-2 rounded">
              <label className="text-primaryText/60 text-sm mb-1">{key} (Array)</label>
              <div className="flex flex-col gap-2">
                {value.map((item, index) => {
                  if (Array.isArray(item)) {
                    // Handle nested arrays (e.g., `rows`)
                    return (
                      <div
                        key={index}
                        className="flex flex-col border border-primaryText/35 p-2 rounded"
                      >
                        <label className="text-primaryText/50 text-xs mb-1">Row {index + 1}</label>
                        {item.map((subItem, subIndex) => (
                          <div key={subIndex} className="flex items-center gap-2">
                            <input
                              type={typeof subItem === 'number' ? 'number' : 'text'}
                              value={String(subItem)}
                              className="input input-bordered w-full max-w-xs h-8"
                              onChange={(e) => {
                                const newArray = [...value]
                                ;(newArray[index] as unknown[])[subIndex] =
                                  typeof subItem === 'number'
                                    ? Number(e.target.value)
                                    : e.target.value
                                handleChange(key, newArray)
                              }}
                            />
                            <button
                              className="btn btn-error btn-xs"
                              onClick={() => {
                                const newArray = [...value]
                                ;(newArray[index] as string[]).splice(subIndex, 1)
                                handleChange(key, newArray)
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )
                  }

                  // Handle regular arrays
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type={typeof item === 'number' ? 'number' : 'text'}
                        value={String(item)}
                        className="input input-bordered w-full max-w-xs h-8"
                        onChange={(e) => {
                          const newArray = [...value]
                          newArray[index] =
                            typeof item === 'number' ? Number(e.target.value) : e.target.value
                          handleChange(key, newArray)
                        }}
                      />
                      <button
                        className="btn btn-error btn-xs"
                        onClick={() => {
                          const newArray = value.filter((_, i) => i !== index)
                          handleChange(key, newArray)
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        }

        if (typeof value === 'object' && value !== null) {
          return (
            <div key={key} className="flex flex-col ml-2 mb-1 border p-2 rounded">
              <label className="text-primaryText/60 text-sm mb-1">{key} (Object)</label>
              <GenericDataExplorer
                data={{ ...value }}
                setData={(updated) => handleChange(key, updated)}
              />
            </div>
          )
        }

        return null
      })}
    </div>
  )
}

export const GenericDataExplorer = memo(Component)
