<script setup>
import { inject, onMounted, onUnmounted, provide, shallowRef, triggerRef, useTemplateRef, watch } from 'vue';
import { dia, shapes } from '@joint/core';
import TaskCard from './TaskCard.vue';

const props = defineProps(['tasks', 'scale']);
const emit = defineEmits(['task-change']);

const graph = inject('graph');
const paperElement = useTemplateRef('paperElement');
const paper = shallowRef(null);

provide('paper', paper);

// Create the JointJS paper once its element is available.
onMounted(() => {
    paper.value = new dia.Paper({
        el: paperElement.value,
        model: graph,
        cellViewNamespace: shapes,
        width: 850,
        height: 600,
        background: {
            color: '#F8F9FB'
        }
    });
});

onUnmounted(() => {
    paper.value?.remove();
});

// A custom observable of the graph elements' positions.
// Observing the graph directly could trigger too many updates.
const htmlElements = shallowRef(graph.getElements().map((cell) => {
    return { id: cell.id, position: cell.position() };
}));

function onPositionChange(cell) {
    const htmlElement = htmlElements.value.find(({ id }) => id === cell.id);
    if (!htmlElement) return;
    htmlElement.position = cell.position();
    triggerRef(htmlElements);
}

graph.on('change:position', onPositionChange);
onUnmounted(() => graph.off('change:position', onPositionChange));

watch(() => props.scale, (scale) => {
    paper.value.scaleUniformAtPoint(scale, paper.value.getArea().center());
});

function handleTaskInput(taskId, key, value) {
    emit('task-change', taskId, key, value);
}
</script>

<template>
    <TaskCard
        v-for="element in htmlElements"
        :key="element.id"
        :id="element.id"
        :position="element.position"
        :scale="scale"
        :task="tasks[element.id]"
        @input="handleTaskInput"
    />
    <div ref="paperElement" />
</template>
