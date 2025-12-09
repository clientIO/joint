// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
const reduxDevelopmentTools = globalThis?.__REDUX_DEVTOOLS_EXTENSION__?.connect({
  name: 'CustomState', // This will name your instance in the DevTools
  trace: true, // Enables trace if needed
});

if (reduxDevelopmentTools) {
  reduxDevelopmentTools.init({ message: 'Initial state' });
}

interface SendOptions {
  message?: string;
  type: string;
  value: unknown;
  name: string;
}
/**
 * Send state information to Redux DevTools if available
 * @param options Options containing message, type, value, and name
 */
export function sendToDevTool(options: SendOptions) {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  if (!reduxDevelopmentTools) {
    return;
  }
  const { message, type, value, name } = options;
  reduxDevelopmentTools.send(name, { value, type, message }, type);
}
