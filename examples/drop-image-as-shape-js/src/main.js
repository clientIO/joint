import { dia, shapes } from '@joint/core';
import './styles.scss';

const paperContainer = document.getElementById('paper-container');

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    width: '100%',
    height: '100%',
    gridSize: 20,
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    background: { color: '#F3F7F6' }
});

paperContainer.appendChild(paper.el);

function dragoverHandler(evt) {
    evt.preventDefault();
}

function dragenterHandler(evt) {
    evt.preventDefault();
    paperContainer.classList.add('drag-n-drop');
}

function dragleaveHandler(evt) {
    evt.preventDefault();
    paperContainer.classList.remove('drag-n-drop');
}

async function dropHandler(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    const files = Array.from(event.dataTransfer.files);
    const promises = files.map((file) => readImageFile(file));
    const result = await Promise.all(promises);
    const images = result.filter((image) => image !== null);
    const shift = 20;
    const { x, y } = paper.clientToLocalPoint(evt.clientX, evt.clientY);
    images.forEach((image, index) =>
        image.position(x - shift * index, y - shift * index)
    );
    graph.addCells(images);
    paperContainer.classList.remove('drag-n-drop');
}

function readImageFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener(
            'load',
            () => {
                const img = new Image();
                img.onload = () => {
                    const el = createImage(
                        reader.result,
                        img.naturalWidth / 4,
                        img.naturalHeight / 4
                    );
                    resolve(el);
                };
                img.onerror = function() {
                    resolve(null);
                };
                img.src = reader.result;
            },
            false
        );
        reader.readAsDataURL(file);
    });
}

function createImage(href, width, height) {
    return new shapes.standard.BorderedImage({
        size: { width, height },
        attrs: {
            image: {
                href,
                preserveAspectRatio: 'none'
            }
        }
    });
}

paper.el.addEventListener('dragover', dragoverHandler);
paper.el.addEventListener('dragenter', dragenterHandler);
paper.el.addEventListener('dragleave', dragleaveHandler);
paper.el.addEventListener('drop', dropHandler);
