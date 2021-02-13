var DATA = {
    scale: 1,
    tasks: {
        taskA: {
            title: 'Create Story',
            assignment: 'Bob',
            status: 'done',
        },
        taskB: {
            title: 'Promote',
            assignment: 'Mary',
            status: 'pending',
        },
        taskC: {
            title: 'Measure',
            assignment: 'John',
            status: 'at-risk',
        },
    },
};

// Define a Vue Component for Toolbar
var ToolbarComponent = {
    emits: ['zoom-out', 'zoom-in', 'reset'],
    template: `
        <div class="toolbar">
            <button @click="$emit('zoom-out')">Zoom Out</button>
            <button @click="$emit('zoom-in')">Zoom In</button>
            <button @click="$emit('reset')">Reset</button>
        </div>
    `,
};

// Define a Vue Component for Task
var TaskComponent = {
    props: ['id', 'task', 'position', 'scale'],
    emits: ['input'],
    template: `
        <div
            ref="taskElement"
            class="task"
            :data-status="task.status"
            :style="taskElementStyle"
        >
            <header><h1 v-text="task.title"/><i/></header>
            <input
                placeholder="Enter an assignment …"
                :value="task.assignment"
                @input="$emit('input', id, 'assignment', $event.target.value)"
            />
            <select :value="task.status" @input="$emit('input', id, 'status', $event.target.value)">
                <option disabled value="" text="Select status …"/>
                <option value="done" text="Done"/>
                <option value="pending" text="Pending"/>
                <option value="at-risk" text="At Risk"/>
            </select>
        </div>
    `,
    setup(props) {
        var graph = Vue.inject('graph');
        var paperContext = Vue.inject('paperContext');

        var taskElement = Vue.ref(null);
        var taskElementPosition = Vue.shallowRef({ x: 0, y: 0 });
        var taskElementStyle = Vue.computed(function () {
            return {
                top: (taskElementPosition.value.y || 0) + 'px',
                left: (taskElementPosition.value.x || 0) + 'px',
                transform: 'scale(' + props.scale + ')',
                transformOrigin: '0 0',
            }
        });

        // Update task element position to match the graph Element View
        function updateTaskElementPosition() {
            if (paperContext.paper) {
                var graphElementView = paperContext.paper.findViewByModel(graph.getCell(props.id));
                var viewBBox = graphElementView.getBBox({ useModelGeometry: true });
                taskElementPosition.value = { x: viewBBox.x, y: viewBBox.y };
            }
        }

        Vue.onMounted(function () {
            // Resize the graph Element to match the task element ...
            graph.getCell(props.id).resize(taskElement.value.offsetWidth, taskElement.value.offsetHeight);
            // ... and update task element position afterwards
            Vue.nextTick(updateTaskElementPosition);
        });

        // React to changes of position/scale
        Vue.watch(
            function () {
                return {
                    position: props.position,
                    scale: props.scale,
                };
            },
            updateTaskElementPosition,
        );

        return {
            id: props.id,
            task: props.task,
            taskElement: taskElement,
            taskElementStyle: taskElementStyle,
        };
    },
};

// Define a Vue Component for JointJS Paper
var JointPaperComponent = {
    props: ['tasks', 'scale'],
    emits: ['task-change'],
    components: { 'my-task': TaskComponent },
    template: `
        <my-task
            v-for="element in htmlElements"
            :key="element.id"
            :id="element.id"
            :position="element.position"
            :scale="scale"
            :task="tasks[element.id]"
            @input="handleTaskInput"
        />
        <div ref="paperElement"/>
    `,
    setup(props, vmContext) {
        var scale = Vue.toRef(props, 'scale');
        var graph = Vue.inject('graph');
        var paperElement = Vue.ref(null);
        var paperContext = {};

        Vue.provide('paperContext', paperContext);

        // Create JointJS Paper (after the paper element is available)
        Vue.onMounted(function () {
            paperContext.paper = new joint.dia.Paper({
                el: paperElement.value,
                model: graph,
                width: 850,
                height: 600,
                background: {
                    color: '#F8F9FB',
                },
            });
        });

        /*
         * Create a custom observable for (current) graph elements.
         * Warning: Observing the graph directly may trigger
         * too many updates and cause performance issues.
        */
        var htmlElements = Vue.shallowRef(
            graph.getElements().map(function (cell) {
                return { id: cell.get('id'), position: cell.get('position')};
            })
        );

        // Track positions of graph elements
        graph.on('change:position', function (cell) {
            for (var i = 0; i < htmlElements.value.length; i += 1) {
                if (htmlElements.value[i].id === cell.get('id')) {
                    htmlElements.value[i].position = cell.get('position');
                    Vue.triggerRef(htmlElements);
                    break;
                }
            }
        });

        // React to changes of scale
        Vue.watch(
            function () { return scale.value; },
            function (value) {
                var size = paperContext.paper.getComputedSize();
                paperContext.paper.translate(0, 0);
                paperContext.paper.scale(value, value, size.width / 2, size.height / 2);
            }
        );

        function handleTaskInput(taskId, key, value) {
            vmContext.emit('task-change', taskId, key, value);
        }

        return {
            tasks: props.tasks,
            paperElement: paperElement,
            htmlElements: htmlElements,
            scale: scale,
            handleTaskInput: handleTaskInput,
        };
    },
};

// Create a Vue application
var app = Vue.createApp({
    components: { 'my-toolbar': ToolbarComponent, 'my-joint-paper': JointPaperComponent },
    template: `
        <my-toolbar @zoom-out="zoomOut" @zoom-in="zoomIn" @reset="reset"/>
        <my-joint-paper :scale="scale" :tasks="tasks" @task-change="handleTaskChange"/>
    `,
    setup() {
        var tasks = Vue.reactive(JSON.parse(JSON.stringify(DATA.tasks)));
        var scale = Vue.ref(DATA.scale);
        var graph = new joint.dia.Graph();

        Vue.provide('graph', graph);

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
            scale.value = DATA.scale;

            graph.getCell('taskA').position(17, 100);
            graph.getCell('taskB').position(297, 100);
            graph.getCell('taskC').position(576, 100);

            Object.entries(DATA.tasks).forEach(function ([taskId, task]) {
                Object.entries(task).forEach(function ([key, value]) {
                    handleTaskChange(taskId, key, value);
                });
            });
        }

        // Create JointJS elements and links for the tasks
        var rect1 = (new joint.shapes.standard.Rectangle()).position(17, 100).attr({
            body: { fill: 'transparent', strokeWidth: 0 }
        }).prop('id', 'taskA');
        var rect2 = rect1.clone().position(297, 100).prop('id', 'taskB');
        var rect3 = rect1.clone().position(576, 100).prop('id', 'taskC');
        var link1 = (new joint.shapes.standard.Link()).source(rect1).target(rect2);
        var link2 = (new joint.shapes.standard.Link()).source(rect2).target(rect3);
        graph.resetCells([rect1, rect2, rect3, link1, link2]);

        return {
            tasks: tasks,
            zoomOut: zoomOut,
            zoomIn: zoomIn,
            reset: reset,
            scale: scale,
            handleTaskChange: handleTaskChange,
        };
    },
}).mount('#app');
