<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { dia, shapes, elementTools } from '@joint/core';

const canvas = ref<Element | null>(null);

const graph = new dia.Graph({}, { cellNamespace: shapes });

const paper = new dia.Paper({
  model: graph,
  background: {
    color: '#F8F9FA'
  },
  sorting: dia.Paper.sorting.APPROX,
  cellViewNamespace: shapes
});

const rect = new shapes.standard.Rectangle({
  position: { x: 100, y: 100 },
  size: { width: 100, height: 50 },
  attrs: {
    label: {
      text: 'Hello World',
      textWrap: {
        width: 'calc(w - 20)',
        height: 'calc(h - 20)',
        ellipsis: true,
      }
    }
  }
});

graph.addCell(rect);

const toolsView = new dia.ToolsView({
  tools: [
    new elementTools.Boundary({ padding: 10 }),
    new elementTools.Remove(),
  ]
});
rect.findView(paper).addTools(toolsView);
rect.findView(paper).vel.translateAndAutoOrient({ x: 10, y: 10, }, { x: 100, y: 100 }, paper.svg);

onMounted(() => {
  canvas.value?.appendChild(paper.el);
});
</script>

<template>
  <div class="canvas" ref="canvas"></div>
</template>

<style scoped>
.canvas {
  width: 100%;
  height: 100%;
}

.canvas:deep(.joint-paper) {
  border: 1px solid #a0a0a0;
}
</style>
