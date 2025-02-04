import { useGraph } from './use-graph'

export function useGraphCellsValue() {
  const graph = useGraph()
  const [cells, setCells] = useState(() => graph.getCells())

  useEffect(() => {
    const handleCellsChange = () => {
      setCells(graph.getCells())
    }
    return listenToCellChange(graph, handleCellsChange)
  }, [graph])
}
