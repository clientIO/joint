import { dia } from 'jointjs';
import { Card, ExternalLink } from './shapes';

interface MonitorComponent {
    cell: dia.Cell;
    port: string | null;
}

interface MonitorCallbackData extends MonitorComponent {
    resolved: boolean;
}


export class Monitor {

    readonly interval = 500;
    readonly maxAlerts = 5;

    private graph: dia.Graph;

    /**
     * Monitor class for monitoring alerts on the graph.
     * @example
     * const monitor = new Monitor(graph);
     * const unsubscribe = monitor.subscribe((data) => {
     *   const { cell, port, resolved } = data;
     *  if (resolved) {
     *    console.log(`Alert resolved on ${cell.id} port ${port}`);
     * } else {
     *   console.log(`Alert on ${cell.id} port ${port}`);
     * }
     * });
     * // Unsubscribe from the monitor
     * unsubscribe();
     */
    constructor(graph: dia.Graph) {
        this.graph = graph;
    }

    /**
     * Subscribe to monitor events.
     * @param callback The callback function to be called when an event occurs.
     * The callback function receives an object with the following properties:
     * - cell: The cell which the event occurred on.
     * - port: The port which the event occurred on. If the event occurred on a link, this will be null.
     * - resolved: Whether the event is a new alert or a resolved alert.
     * @returns A function that can be called to unsubscribe from the monitor.
     */
    subscribe(callback: (data: MonitorCallbackData) => void) {
        const { interval, maxAlerts } = this;
        const components = this.getGraphComponents();
        const alerts = [];
        const intervalId = setInterval(() => {
            if (alerts.length > Math.random() * maxAlerts + 1) {
                const component = alerts.shift();
                callback({ ...component, resolved: true });
            } else {
                const component = components[Math.floor(Math.random() * components.length)];
                alerts.push(component);
                callback({ ...component, resolved: false });
            }
        }, interval);
        return () => clearInterval(intervalId);
    }

    protected getGraphComponents(): MonitorComponent[] {
        const { graph } = this;
        const components = [];
        graph.getCells().forEach((cell) => {
            if (cell.isElement()) {
                if (Card.isCard(cell)) {
                    const ports = cell.getPorts();
                    ports.forEach((port) => {
                        components.push({ cell, port: port.id });
                    });
                }
            } else {
                if (ExternalLink.isExternalLink(cell)) return;
                components.push({ cell, port: null });
            }
        });
        return components;
    }
}
