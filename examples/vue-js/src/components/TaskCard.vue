<script setup>
import { computed, inject, nextTick, onMounted, shallowRef, useTemplateRef, watch } from 'vue';

const props = defineProps(['id', 'task', 'position', 'scale']);
defineEmits(['input']);

const graph = inject('graph');
const paper = inject('paper');

const taskElement = useTemplateRef('taskElement');
const taskElementPosition = shallowRef({ x: 0, y: 0 });
const taskElementStyle = computed(() => {
    return {
        top: `${taskElementPosition.value.y}px`,
        left: `${taskElementPosition.value.x}px`,
        transform: `scale(${props.scale})`,
        transformOrigin: '0 0'
    };
});

// Move the task over its element view.
function updateTaskElementPosition() {
    if (!paper.value) return;
    const elementView = paper.value.findViewByModel(graph.getCell(props.id));
    const { x, y } = elementView.getBBox({ useModelGeometry: true });
    taskElementPosition.value = { x, y };
}

onMounted(() => {
    // Resize the element to match the task ...
    graph.getCell(props.id).resize(taskElement.value.offsetWidth, taskElement.value.offsetHeight);
    // ... then move the task over it.
    nextTick(updateTaskElementPosition);
});

watch(() => [props.position, props.scale], updateTaskElementPosition);
</script>

<template>
    <div
        ref="taskElement"
        class="task"
        :data-status="task.status"
        :style="taskElementStyle"
    >
        <header><h1>{{ task.title }}</h1><i /></header>
        <input
            placeholder="Enter an assignment …"
            :value="task.assignment"
            @input="$emit('input', id, 'assignment', $event.target.value)"
        />
        <select :value="task.status" @input="$emit('input', id, 'status', $event.target.value)">
            <option disabled value="">Select status …</option>
            <option value="done">Done</option>
            <option value="pending">Pending</option>
            <option value="at-risk">At Risk</option>
        </select>
    </div>
</template>
