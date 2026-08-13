import '../styles.scss';
import { initSimpleExample } from './simple-graph/example';
import { initLargeGraphExample } from './large-graph/example';
import { initSimpleExampleExtra } from './simple-graph-extra/example';

const panels = {
    simple: document.getElementById('canvas-simple'),
    large: document.getElementById('canvas-large'),
    simpleExtra: document.getElementById('canvas-simple-extra'),
};

const initializers = {
    simple: initSimpleExample,
    large: initLargeGraphExample,
    simpleExtra: initSimpleExampleExtra,
};

const initialized = {};

function activateTab(name) {
    document.querySelectorAll('.tab-button').forEach((button) => {
        button.classList.toggle('active', button.dataset.tab === name);
    });

    Object.entries(panels).forEach(([tabName, panelEl]) => {
        panelEl.style.display = tabName === name ? '' : 'none';
    });

    if (!initialized[name]) {
        initialized[name] = initializers[name](panels[name]);
    }
}

document.querySelectorAll('.tab-button').forEach((button) => {
    button.addEventListener('click', () => activateTab(button.dataset.tab));
});

activateTab('simple');
