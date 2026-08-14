import '../styles.scss';
import { initSimpleExample } from './simple-graph/example';
import { initLargeGraphExample } from './large-graph/example';
import { initSimpleExampleExtra } from './simple-graph-extra/example';

type TabName = 'simple' | 'large' | 'simpleExtra';

const panels: Record<TabName, HTMLElement> = {
    simple: document.getElementById('canvas-simple') as HTMLElement,
    large: document.getElementById('canvas-large') as HTMLElement,
    simpleExtra: document.getElementById('canvas-simple-extra') as HTMLElement,
};

const initializers: Record<TabName, (canvasEl: HTMLElement) => Promise<unknown>> = {
    simple: initSimpleExample,
    large: initLargeGraphExample,
    simpleExtra: initSimpleExampleExtra,
};

const initialized: Partial<Record<TabName, unknown>> = {};

function activateTab(name: TabName): void {
    document.querySelectorAll<HTMLButtonElement>('.tab-button').forEach((button) => {
        button.classList.toggle('active', button.dataset.tab === name);
    });

    Object.entries(panels).forEach(([tabName, panelEl]) => {
        panelEl.style.display = tabName === name ? '' : 'none';
    });

    if (!initialized[name]) {
        initialized[name] = initializers[name](panels[name]);
    }
}

document.querySelectorAll<HTMLButtonElement>('.tab-button').forEach((button) => {
    button.addEventListener('click', () => activateTab(button.dataset.tab as TabName));
});

activateTab('simple');
