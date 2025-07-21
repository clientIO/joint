import { Listener } from '../../mvc/Listener.mjs';

export class GroupsController extends Listener {

    constructor(context) {
        super(context);

        this.graph = context.graph;

        if (!this.graph.has('groups')) {
            this.graph.set('groups', []);
        }

        this.groups = this.graph.get('groups');
        this.groupsMap = {};

        this.groups.forEach(layer => {
            this.groupsMap[layer.name] = layer;
        });

        this.defaultGroupName = this.graph.defaultGroupName;

        this.startListening();
    }

    startListening() {
        const { graph } = this;

        this.listenTo(graph, 'add', (_context, cell) => {
            this.onAdd(cell);
        });

        this.listenTo(graph, 'remove', (_context, cell) => {
            this.onRemove(cell);
        });

        this.listenTo(graph, 'reset', (_context, { models: cells }) => {
            const { groupsMap } = this;

            for (let groupName in groupsMap) {
                groupsMap[groupName].reset();
            }

            cells.forEach(cell => {
                this.onAdd(cell, true);
            });
        });

        this.listenTo(graph, 'change:layer', (_context, cell, groupName) => {
            if (!groupName) {
                groupName = this.defaultGroupName;
            }

            if (this.hasGroup(groupName)) {
                this.groupsMap[groupName].add(cell);
            }
        });
    }

    onAdd(cell, reset = false) {
        const { groupsMap } = this;

        const groupName = cell.layer() || this.defaultGroupName;
        const layer = groupsMap[groupName];

        if (!layer) {
            throw new Error(`dia.Graph: Layer with name '${groupName}' does not exist.`);
        }

        // compatibility
        // in the version before groups, z-index was not set on reset
        if (!reset) {
            if (!cell.has('z')) {
                cell.set('z', layer.maxZIndex() + 1);
            }
        }

        // mandatory add to the layer
        // so every cell now will have a layer specified
        layer.add(cell);
    }

    onRemove(cell) {
        const { groupsMap } = this;

        const groupName = cell.layer() || this.defaultGroupName;

        const layer = groupsMap[groupName];

        if (layer) {
            layer.remove(cell);
        }
    }

    getDefaultGroup() {
        return this.groupsMap[this.defaultGroupName];
    }

    addGroup(group, _opt) {
        const { groupsMap } = this;

        if (groupsMap[group.name]) {
            throw new Error(`dia.Graph: Layer with name '${group.name}' already exists.`);
        }

        this.groups = this.groups.concat([group]);

        groupsMap[group.name] = group;

        this.graph.set('groups', this.groups);
    }

    removeGroup(groupName, _opt) {
        const { groupsMap, defaultGroupName } = this;

        if (groupName === defaultGroupName) {
            throw new Error('dia.Graph: default layer cannot be removed.');
        }

        if (!groupsMap[groupName]) {
            throw new Error(`dia.Graph: Layer with name '${groupName}' does not exist.`);
        }

        this.groups = this.groups.filter(l => l.name !== groupName);

        delete this.groupsMap[groupName];
        this.graph.set('groups', this.groups);
    }

    minZIndex(groupName) {
        const { groupsMap, defaultGroupName } = this;

        groupName = groupName || defaultGroupName;

        const layer = groupsMap[groupName];

        return layer.minZIndex();
    }

    maxZIndex(groupName) {
        const { groupsMap, defaultGroupName } = this;

        groupName = groupName || defaultGroupName;

        const layer = groupsMap[groupName];

        return layer.maxZIndex();
    }

    hasGroup(groupName) {
        return !!this.groupsMap[groupName];
    }

    getGroup(groupName) {
        if (!this.groupsMap[groupName]) {
            throw new Error(`dia.Graph: Layer with name '${groupName}' does not exist.`);
        }

        return this.groupsMap[groupName];
    }

    getGroups() {
        const groups = [];

        for (let groupName in this.groupsMap) {
            groups.push(this.groupsMap[groupName]);
        }

        return groups;
    }

    getGroupCells(groupName) {
        return this.groupsMap[groupName].get('cells').toArray();
    }

    getCells() {
        const cells = [];

        for (let groupName in this.groupsMap) {
            cells.push(...this.groupsMap[groupName].get('cells'));
        }

        return cells;
    }
}
