<script setup>
import { provide, reactive, ref } from 'vue';
import { dia, shapes } from '@joint/core';
import { INITIAL_SCALE, TASKS } from './data.js';
import AppToolbar from './components/AppToolbar.vue';
import JointPaper from './components/JointPaper.vue';

const tasks = reactive(structuredClone(TASKS));
const scale = ref(INITIAL_SCALE);
const graph = new dia.Graph({}, { cellNamespace: shapes });

provide('graph', graph);

// One transparent element per task - the task itself is HTML rendered over it.
const elements = Object.entries(TASKS).map(([id, { position }]) => {
    return new shapes.standard.Rectangle({
        id,
        position,
        attrs: { body: { fill: 'transparent', strokeWidth: 0 }}
    });
});
const links = [
    new shapes.standard.Link().source(elements[0]).target(elements[1]),
    new shapes.standard.Link().source(elements[1]).target(elements[2])
];
graph.resetCells([...elements, ...links]);

function handleTaskChange(taskId, key, value) {
    tasks[taskId][key] = value;
}

function zoomOut() {
    scale.value = Math.max(0.2, scale.value - 0.2);
}

function zoomIn() {
    scale.value = Math.min(3, scale.value + 0.2);
}

function reset() {
    scale.value = INITIAL_SCALE;
    Object.entries(TASKS).forEach(([taskId, { position, ...task }]) => {
        graph.getCell(taskId).position(position.x, position.y);
        Object.entries(task).forEach(([key, value]) => handleTaskChange(taskId, key, value));
    });
}
</script>

<template>
    <AppToolbar @zoom-out="zoomOut" @zoom-in="zoomIn" @reset="reset" />
    <JointPaper :scale="scale" :tasks="tasks" @task-change="handleTaskChange" />
</template>
