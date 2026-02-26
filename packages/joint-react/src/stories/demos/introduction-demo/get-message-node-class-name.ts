const BASE_MESSAGE_NODE_CLASS_NAME =
  'flex flex-row border-1 border-solid border-white/20 text-white rounded-lg p-4 min-w-[250px] min-h-[100px] bg-gray-900 shadow-sm';

export function getMessageNodeClassName(isSelected: boolean): string {
  if (isSelected) {
    return `${BASE_MESSAGE_NODE_CLASS_NAME} border-2 border-cyan-300 joint-react-introduction-node-selected`;
  }
  return BASE_MESSAGE_NODE_CLASS_NAME;
}
