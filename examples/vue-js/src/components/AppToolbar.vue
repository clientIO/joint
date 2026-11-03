<script setup>
defineEmits(['zoom-out', 'zoom-in', 'reset']);
</script>

<template>
    <div class="toolbar">
        <button @click="$emit('zoom-out')">Zoom Out</button>
        <button @click="$emit('zoom-in')">Zoom In</button>
        <button @click="$emit('reset')">Reset</button>
    </div>
</template>
