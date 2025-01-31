<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { dia, shapes } from '@joint/core';

const canvas = ref<Element | null>(null);

const graph = new dia.Graph({}, { cellNamespace: shapes });

const paper = new dia.Paper({
  model: graph,
  background: {
    color: '#F8F9FA'
  },
  frozen: true,
  async: true,
  sorting: dia.Paper.sorting.APPROX,
  cellViewNamespace: shapes
});

const rect = new shapes.standard.Rectangle({
  position: { x: 100, y: 100 },
  size: { width: 100, height: 50 },
  attrs: {
    label: {
      text: 'Hello World'
    }
  }
});

graph.addCell(rect);

onMounted(() => {
  canvas.value?.appendChild(paper.el);
  paper.unfreeze();
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
