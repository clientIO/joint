import { useCellId } from './use-cell-id';
import { useElements } from './use-elements';

export function useElement() {
  const cellId = useCellId();
  return useElements((elements) => elements.find(({ id }) => id === cellId));
}
