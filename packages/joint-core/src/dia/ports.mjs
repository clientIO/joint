import * as util from '../util/index.mjs';
import V from '../V/index.mjs';
import { Rect, Point } from '../g/index.mjs';
import * as Port from '../layout/ports/port.mjs';
import * as PortLabel from '../layout/ports/portLabel.mjs';

const DEFAULT_PORT_POSITION_NAME = 'left';
const DEFAULT_ABSOLUTE_PORT_POSITION_NAME = 'absolute';
const DEFAULT_PORT_LABEL_POSITION_NAME = 'left';

const PortData = function(model) {

    const { portLayoutNamespace = Port, portLabelLayoutNamespace = PortLabel } = model;

    const clonedData = util.cloneDeep(model.get('ports')) || {};
    this.ports = [];
    this.portsMap = {};
    this.groups = {};
    this.portLayoutNamespace = portLayoutNamespace;
    this.portLabelLayoutNamespace = portLabelLayoutNamespace;
    this.metrics = {};
    this.metricsKey = null;

    this._init(clonedData);
};

PortData.prototype = {

    hasPort: function(id) {
        return id in this.portsMap;
    },

    getPort: function(id) {
        const port = this.portsMap[id];
        if (port) return port;
        throw new Error('Element: unable to find port with id ' + id);
    },

    getPorts: function() {
        return this.ports;
    },

    getGroup: function(name) {
        return this.groups[name] || {};
    },

    getPortsByGroup: function(groupName) {

        return this.ports.filter(function(port) {
            return port.group === groupName;
        });
    },

    // Calculate SVG transformations based on evaluated group + port data
    // NOTE: This function is also called for ports without a group (groupName = undefined)
    getGroupPortsMetrics: function(groupName, rect) {

        const { x = 0, y = 0, width = 0, height = 0 } = rect;
        const metricsKey = `${x}:${y}:${width}:${height}`;
        if (this.metricsKey !== metricsKey) {
            // Clear the cache (the element size has changed)
            this.metrics = {};
            this.metricsKey = metricsKey;
        }

        let groupPortsMetrics = this.metrics[groupName];
        if (groupPortsMetrics) {
            // Return cached metrics
            return groupPortsMetrics;
        }

        // Calculate the metrics
        groupPortsMetrics = this.resolveGroupPortsMetrics(groupName, new Rect(x, y, width, height));
        this.metrics[groupName] = groupPortsMetrics;
        return groupPortsMetrics;
    },

    resolveGroupPortsMetrics: function(groupName, elBBox) {

        // `groupName` of `undefined` (= not a string) means "the group of ports which do not have the `group` property".
        const isNoGroup = (groupName === undefined);

        const group = this.getGroup(groupName);
        const ports = this.getPortsByGroup(groupName);

        const portsArgs = ports.map(function(port) {
            return port && port.position && port.position.args;
        });

        // Get an array of transformations of individual ports according to the group's port layout function:
        let groupPortTransformations;
        if (isNoGroup) {
            // Apply default port layout function to the set of ports without `group` property.
            const noGroup = this._evaluateGroup({});
            groupPortTransformations = this._getGroupPortTransformations(noGroup, portsArgs, elBBox);

        } else {
            groupPortTransformations = this._getGroupPortTransformations(group, portsArgs, elBBox);
        }

        let accumulator = {
            ports: ports,
            result: {}
        };

        // For each individual port transformation, find the information necessary to calculate SVG transformations:
        util.toArray(groupPortTransformations).reduce((res, portTransformation, index) => {
            const port = res.ports[index];
            const portId = port.id;
            res.result[portId] = {
                index,
                portId,
                portTransformation: portTransformation,
                labelTransformation: this._getPortLabelTransformation(port, Point(portTransformation), elBBox),
                portAttrs: port.attrs,
                portSize: port.size,
                labelSize: port.label.size
            };
            return res;
        }, accumulator);

        return accumulator.result;
    },

    _getGroupPortTransformations: function(group, portsArgs, elBBox) {

        const groupPosition = group.position || {};
        const groupPositionArgs = groupPosition.args || {};
        const groupPositionLayoutCallback = groupPosition.layoutCallback;
        return groupPositionLayoutCallback(portsArgs, elBBox, groupPositionArgs);
    },

    _getPortLabelTransformation: function(port, portPosition, elBBox) {

        const portLabelPosition = port.label.position || {};
        const portLabelPositionArgs = portLabelPosition.args || {};
        const portLabelPositionLayoutCallback = portLabelPosition.layoutCallback;
        if (portLabelPositionLayoutCallback) {
            return portLabelPositionLayoutCallback(portPosition, elBBox, portLabelPositionArgs);
        }

        return null;
    },

    _init: function(data) {

        // Prepare groups:
        // NOTE: This overwrites passed group properties with evaluated group properties.
        if (util.isObject(data.groups)) {
            var groups = Object.keys(data.groups);
            for (var i = 0, n = groups.length; i < n; i++) {
                var key = groups[i];
                this.groups[key] = this._evaluateGroup(data.groups[key]);
            }
        }

        // Prepare ports:
        // NOTE: This overwrites passed port properties with evaluated port properties, plus mixed-in evaluated group properties (see above).
        var ports = util.toArray(data.items);
        for (var j = 0, m = ports.length; j < m; j++) {
            const resolvedPort = this._evaluatePort(ports[j]);
            this.ports.push(resolvedPort);
            this.portsMap[resolvedPort.id] = resolvedPort;
        }
    },

    _evaluateGroup: function(group) {

        return util.merge(
            {},
            group,
            {
                position: this._evaluateGroupPositionProperty(group),
                label: this._evaluateGroupLabelProperty(group)
            }
        );
    },

    _evaluateGroupPositionProperty: function(group) {

        const namespace = this.portLayoutNamespace;
        const groupPosition = group.position;
        if (groupPosition === undefined) {
            const layoutCallback = this._resolveLayoutCallbackOrThrow(namespace, DEFAULT_PORT_POSITION_NAME, 'Default port group');
            return { layoutCallback };

        } else if (util.isFunction(groupPosition)) {
            return { layoutCallback: groupPosition };

        } else if (util.isObject(groupPosition)) {
            if (groupPosition.name) {
                const layoutCallback = this._resolveLayoutCallbackOrThrow(namespace, groupPosition.name, 'Provided port group');
                return { layoutCallback, args: groupPosition.args };
            } else {
                const layoutCallback = this._resolveLayoutCallbackOrThrow(namespace, DEFAULT_PORT_POSITION_NAME, 'Default port group');
                return { layoutCallback, args: groupPosition.args };
            }

        } else if (util.isString(groupPosition)) {
            // TODO: Remove legacy signature (see `this._evaluateGroupLabelPositionProperty()`).
            const layoutCallback = this._resolveLayoutCallbackOrThrow(namespace, groupPosition, 'Provided port group');
            return { layoutCallback };

        } else if (Array.isArray(groupPosition)) {
            // TODO: Remove legacy signature (see `this._evaluateGroupLabelPositionProperty()`).
            const layoutCallback = this._resolveLayoutCallbackOrThrow(namespace, DEFAULT_ABSOLUTE_PORT_POSITION_NAME, 'Default absolute port group');
            return { layoutCallback, args: { x: groupPosition[0], y: groupPosition[1] }};

        } else {
            throw new Error('dia.Element: Provided port group position value has an invalid type.');
        }
    },

    _evaluateGroupLabelProperty: function(group) {

        const groupLabel = group.label;
        if (!groupLabel) {
            return {
                position: this._evaluateGroupLabelPositionProperty({})
            };
        }

        return util.merge(
            {},
            groupLabel,
            {
                position: this._evaluateGroupLabelPositionProperty(groupLabel)
            }
        );
    },

    _evaluateGroupLabelPositionProperty: function(groupLabel) {

        const namespace = this.portLabelLayoutNamespace;
        const groupLabelPosition = groupLabel.position;
        if (groupLabelPosition === undefined) {
            const layoutCallback = this._resolveLayoutCallbackOrThrow(namespace, DEFAULT_PORT_LABEL_POSITION_NAME, 'Default port group label');
            return { layoutCallback };

        } else if (util.isFunction(groupLabelPosition)) {
            return { layoutCallback: groupLabelPosition };

        }  else if (util.isObject(groupLabelPosition)) {
            if (groupLabelPosition.name) {
                const layoutCallback = this._resolveLayoutCallbackOrThrow(namespace, groupLabelPosition.name, 'Provided port group label');
                return { layoutCallback, args: groupLabelPosition.args };
            } else {
                const layoutCallback = this._resolveLayoutCallbackOrThrow(namespace, DEFAULT_PORT_LABEL_POSITION_NAME, 'Default port group label');
                return { layoutCallback, args: groupLabelPosition.args };
            }

        } else {
            throw new Error('dia.Element: Provided port group label position value has an invalid type.');
        }
    },

    _evaluatePort: function(port) {

        const group = this.getGroup(port.group);

        const evaluated = util.assign({}, port);
        evaluated.markup = evaluated.markup || group.markup;
        evaluated.attrs = util.merge({}, group.attrs, evaluated.attrs);
        evaluated.position = this._evaluatePortPositionProperty(group, evaluated);
        evaluated.label = this._evaluatePortLabelProperty(group, evaluated);
        evaluated.z = this._evaluatePortZProperty(group, evaluated);
        evaluated.size = util.assign({}, group.size, evaluated.size);
        return evaluated;
    },

    _evaluatePortPositionProperty: function(group, port) {

        return {
            args: util.merge(
                {},
                // NOTE: `x != null` is equivalent to `x !== null && x !== undefined`.
                (group.position != null) ? group.position.args : {},
                // Port can overwrite `group.position.args` via `port.position.args` or `port.args`.
                // TODO: Remove `port.args` backwards compatibility.
                (((port.position != null) && (port.position.args != null)) ? port.position.args : port.args))
        };
    },

    _evaluatePortLabelProperty: function(group, port) {

        const groupLabel = group.label;
        const portLabel = port.label;
        if (!portLabel) {
            return util.assign(
                {},
                groupLabel
            );
        }

        return util.merge(
            {},
            groupLabel,
            util.merge(
                {},
                portLabel,
                {
                    position: this._evaluatePortLabelPositionProperty(portLabel)
                }
            )
        );
    },

    _evaluatePortLabelPositionProperty: function(portLabel) {

        const namespace = this.portLabelLayoutNamespace;
        const portLabelPosition = portLabel.position;
        if (portLabelPosition === undefined) {
            return {};

        } else if (util.isFunction(portLabelPosition)) {
            return { layoutCallback: portLabelPosition };

        }  else if (util.isObject(portLabelPosition)) {
            if (portLabelPosition.name) {
                const layoutCallback = this._resolveLayoutCallbackOrThrow(namespace, portLabelPosition.name, 'Provided port label');
                return { layoutCallback, args: portLabelPosition.args };
            } else {
                return { args: portLabelPosition.args };
            }

        } else {
            throw new Error('dia.Element: Provided port label position value has an invalid type.');
        }
    },

    _evaluatePortZProperty: function(group, port) {

        if (util.isNumber(port.z)) {
            return port.z;
        }
        if (util.isNumber(group.z) || group.z === 'auto') {
            return group.z;
        }
        return 'auto';
    },

    _resolveLayoutCallbackOrThrow: function(namespace, name, errorSubstring) {
        const layoutCallback = namespace[name];
        if (!layoutCallback) {
            throw new Error(`dia.Element: ${errorSubstring} layout name is not recognized.`);
        }
        return layoutCallback;
    }
};

export const elementPortPrototype = {

    _initializePorts: function(options) {
        if (options) {
            // Override port layout namespaces if provided in options
            if (options.portLayoutNamespace) {
                this.portLayoutNamespace = options.portLayoutNamespace;
            }
            // Override port label layout namespaces if provided in options
            if (options.portLabelLayoutNamespace) {
                this.portLabelLayoutNamespace = options.portLabelLayoutNamespace;
            }
        }
        this._createPortData();
        this.on('change:ports', function() {

            this._processRemovedPort();
            this._createPortData();
        }, this);
    },

    /**
     * remove links tied wiht just removed element
     * @private
     */
    _processRemovedPort: function() {

        var current = this.get('ports') || {};
        var currentItemsMap = {};

        util.toArray(current.items).forEach(function(item) {
            currentItemsMap[item.id] = true;
        });

        var previous = this.previous('ports') || {};
        var removed = {};

        util.toArray(previous.items).forEach(function(item) {
            if (!currentItemsMap[item.id]) {
                removed[item.id] = true;
            }
        });

        var graph = this.graph;
        if (graph && !util.isEmpty(removed)) {

            var inboundLinks = graph.getConnectedLinks(this, { inbound: true });
            inboundLinks.forEach(function(link) {

                if (removed[link.get('target').port]) link.remove();
            });

            var outboundLinks = graph.getConnectedLinks(this, { outbound: true });
            outboundLinks.forEach(function(link) {

                if (removed[link.get('source').port]) link.remove();
            });
        }
    },

    /**
     * @returns {boolean}
     */
    hasPorts: function() {

        return this._portSettingsData.getPorts().length > 0;
    },

    /**
     * @param {string} id
     * @returns {boolean}
     */
    hasPort: function(id) {

        return this._portSettingsData.hasPort(id);
    },

    /**
     * @returns {Array<object>}
     */
    getPorts: function() {

        return util.cloneDeep(this.prop('ports/items')) || [];
    },

    /**
     * @returns {Array<object>}
     */
    getGroupPorts: function(groupName) {
        const groupPorts = util.toArray(this.prop(['ports','items'])).filter(port => port.group === groupName);
        return util.cloneDeep(groupPorts);
    },

    /**
     * @param {string} id
     * @returns {object}
     */
    getPort: function(id) {
        const port = util.toArray(this.prop('ports/items')).find(port => port.id && port.id === id);
        return util.cloneDeep(port);
    },

    getPortGroupNames: function() {
        return Object.keys(this._portSettingsData.groups);
    },

    /**
     * @param {string} groupName
     * @returns {Object<portId, {x: number, y: number, angle: number}>}
     */
    getPortsPositions: function(groupName) {

        const portsMetrics = this.getGroupPortsMetrics(groupName);
        const portsPosition = {};
        for (const portId in portsMetrics) {
            const {
                portTransformation: { x, y, angle },
            } = portsMetrics[portId];
            portsPosition[portId] = {
                x: x,
                y: y,
                angle
            };
        }
        return portsPosition;
    },

    getPortMetrics: function(portId) {
        const port = this._portSettingsData.getPort(portId);
        return this.getGroupPortsMetrics(port.group)[portId];
    },

    getGroupPortsMetrics: function(groupName) {
        return this._portSettingsData.getGroupPortsMetrics(groupName, this.size());
    },

    getPortRelativePosition: function(portId) {
        const { portTransformation: { x, y, angle }} = this.getPortMetrics(portId);
        return { x, y, angle };
    },

    getPortRelativeRect(portId) {
        const {
            portTransformation: { x, y, angle },
            portSize: { width, height }
        } = this.getPortMetrics(portId);
        const portRect = {
            x: x - width / 2,
            y: y - height / 2,
            width,
            height,
            angle
        };
        return portRect;
    },

    /**
     * @param {string} portId
     * @returns {Point}
     * @description Returns the port center in the graph coordinate system.
     * The port center is in the graph coordinate system, and the position
     * already takes into account the element rotation.
     **/
    getPortCenter(portId) {
        const elementBBox = this.getBBox();
        const portPosition = this.getPortRelativePosition(portId);
        const portCenter = new Point(portPosition).offset(elementBBox.x, elementBBox.y);
        const angle = this.angle();
        if (angle) portCenter.rotate(elementBBox.center(), -angle);
        return portCenter;
    },

    /**
     * @param {string} portId
     * @param {object} [opt]
     * @param {boolean} [opt.rotate] - If true, the port bounding box is rotated
     * around the port center.
     * @returns {Rect}
     * @description Returns the bounding box of the port in the graph coordinate system.
     * The port center is rotated around the element center, but the port bounding box
     * is not rotated (unless `opt.rotate` is set to true).
     */
    getPortBBox: function(portId, opt) {
        const portRect = this.getPortRelativeRect(portId);
        const elementBBox = this.getBBox();
        // Note: the `angle` property of the `port` is ignore here for now
        const portBBox = new Rect(portRect);
        portBBox.offset(elementBBox.x, elementBBox.y);
        const angle = this.angle();
        if (angle) {
            portBBox.moveAroundPoint(elementBBox.center(), -angle);
        }
        if (opt && opt.rotate) {
            portBBox.rotateAroundCenter(angle);
        }
        return portBBox;
    },

    /**
     * @param {string|Port} port port id or port
     * @returns {number} port index
     */
    getPortIndex: function(port) {

        var id = util.isObject(port) ? port.id : port;

        if (!this._isValidPortId(id)) {
            return -1;
        }

        return util.toArray(this.prop('ports/items')).findIndex(function(item) {
            return item.id === id;
        });
    },

    /**
     * @param {object} port
     * @param {object} [opt]
     * @returns {joint.dia.Element}
     */
    addPort: function(port, opt) {

        if (!util.isObject(port) || Array.isArray(port)) {
            throw new Error('Element: addPort requires an object.');
        }

        var ports = util.assign([], this.prop('ports/items'));
        ports.push(port);
        this.prop('ports/items', ports, opt);

        return this;
    },

    /**
     * @param {string|Port|number} before
     * @param {object} port
     * @param {object} [opt]
     * @returns {joint.dia.Element}
     */
    insertPort: function(before, port, opt) {
        const index = (typeof before === 'number') ? before : this.getPortIndex(before);

        if (!util.isObject(port) || Array.isArray(port)) {
            throw new Error('dia.Element: insertPort requires an object.');
        }

        const ports = util.assign([], this.prop('ports/items'));
        ports.splice(index, 0, port);
        this.prop('ports/items', ports, opt);

        return this;
    },

    /**
     * @param {string} portId
     * @param {string|object=} path
     * @param {*=} value
     * @param {object=} opt
     * @returns {joint.dia.Element}
     */
    portProp: function(portId, path, value, opt) {

        var index = this.getPortIndex(portId);

        if (index === -1) {
            throw new Error('Element: unable to find port with id ' + portId);
        }

        var args = Array.prototype.slice.call(arguments, 1);
        if (Array.isArray(path)) {
            args[0] = ['ports', 'items', index].concat(path);
        } else if (util.isString(path)) {

            // Get/set an attribute by a special path syntax that delimits
            // nested objects by the colon character.
            args[0] = ['ports/items/', index, '/', path].join('');

        } else {

            args = ['ports/items/' + index];
            if (util.isPlainObject(path)) {
                args.push(path);
                args.push(value);
            }
        }

        return this.prop.apply(this, args);
    },

    _validatePorts: function() {

        var portsAttr = this.get('ports') || {};

        var errorMessages = [];
        portsAttr = portsAttr || {};
        var ports = util.toArray(portsAttr.items);

        ports.forEach(function(p) {

            if (typeof p !== 'object') {
                errorMessages.push('Element: invalid port ', p);
            }

            if (!this._isValidPortId(p.id)) {
                p.id = this.generatePortId();
            }
        }, this);

        if (util.uniq(ports, 'id').length !== ports.length) {
            errorMessages.push('Element: found id duplicities in ports.');
        }

        return errorMessages;
    },

    generatePortId: function() {
        return this.generateId();
    },

    /**
     * @param {string} id port id
     * @returns {boolean}
     * @private
     */
    _isValidPortId: function(id) {

        return id !== null && id !== undefined && !util.isObject(id);
    },

    addPorts: function(ports, opt) {

        if (ports.length) {
            this.prop('ports/items', util.assign([], this.prop('ports/items')).concat(ports), opt);
        }

        return this;
    },

    removePort: function(port, opt) {
        const options = opt || {};
        const index = this.getPortIndex(port);
        if (index !== -1) {
            const ports = util.assign([], this.prop(['ports', 'items']));
            ports.splice(index, 1);
            options.rewrite = true;
            this.startBatch('port-remove');
            this.prop(['ports', 'items'], ports, options);
            this.stopBatch('port-remove');
        }
        return this;
    },

    removePorts: function(portsForRemoval, opt) {
        let options, newPorts;
        if (Array.isArray(portsForRemoval)) {
            options = opt || {};
            if (portsForRemoval.length === 0) return this.this;
            const currentPorts = util.assign([], this.prop(['ports', 'items']));
            newPorts = currentPorts.filter(function(cp) {
                return !portsForRemoval.some(function(rp) {
                    const rpId = util.isObject(rp) ? rp.id : rp;
                    return cp.id === rpId;
                });
            });
        } else {
            options = portsForRemoval || {};
            newPorts = [];
        }
        this.startBatch('port-remove');
        options.rewrite = true;
        this.prop(['ports', 'items'], newPorts, options);
        this.stopBatch('port-remove');
        return this;
    },

    /**
     * @private
     */
    _createPortData: function() {

        var err = this._validatePorts();

        if (err.length > 0) {
            this.set('ports', this.previous('ports'));
            throw new Error(err.join(' '));
        }

        var prevPortData;

        if (this._portSettingsData) {

            prevPortData = this._portSettingsData.getPorts();
        }

        this._portSettingsData = new PortData(this);

        var curPortData = this._portSettingsData.getPorts();

        if (prevPortData) {

            var added = curPortData.filter(function(item) {
                if (!prevPortData.find(function(prevPort) {
                    return prevPort.id === item.id;
                })) {
                    return item;
                }
            });

            var removed = prevPortData.filter(function(item) {
                if (!curPortData.find(function(curPort) {
                    return curPort.id === item.id;
                })) {
                    return item;
                }
            });

            if (removed.length > 0) {
                this.trigger('ports:remove', this, removed);
            }

            if (added.length > 0) {
                this.trigger('ports:add', this, added);
            }
        }
    }
};

export const elementViewPortPrototype = {

    portContainerMarkup: 'g',
    portMarkup: [{
        tagName: 'circle',
        selector: 'circle',
        attributes: {
            'r': 10,
            'fill': '#FFFFFF',
            'stroke': '#000000'
        }
    }],
    portLabelMarkup: [{
        tagName: 'text',
        selector: 'text',
        attributes: {
            'fill': '#000000'
        }
    }],
    /** @type {Object<string, {portElement: Vectorizer, portLabelElement: Vectorizer}>} */
    _portElementsCache: null,

    /**
     * @private
     */
    _initializePorts: function() {
        this._cleanPortsCache();
    },

    /**
     * @typedef {Object} Port
     *
     * @property {string} id
     * @property {Object} position
     * @property {Object} label
     * @property {Object} attrs
     * @property {string} markup
     * @property {string} group
     */

    /**
     * @private
     */
    _refreshPorts: function() {

        this._removePorts();
        this._cleanPortsCache();
        this._renderPorts();
    },

    _cleanPortsCache: function() {
        this._portElementsCache = {};
    },

    /**
     * @private
     */
    _renderPorts: function() {

        // references to rendered elements without z-index
        var elementReferences = [];
        var elem = this._getContainerElement();

        for (var i = 0, count = elem.node.childNodes.length; i < count; i++) {
            elementReferences.push(elem.node.childNodes[i]);
        }

        var portsGropsByZ = util.groupBy(this.model._portSettingsData.getPorts(), 'z');
        var withoutZKey = 'auto';

        // render non-z first
        util.toArray(portsGropsByZ[withoutZKey]).forEach(function(port) {
            var portElement = this._getPortElement(port);
            elem.append(portElement);
            elementReferences.push(portElement);
        }, this);

        var groupNames = Object.keys(portsGropsByZ);
        for (var k = 0; k < groupNames.length; k++) {
            var groupName = groupNames[k];
            if (groupName !== withoutZKey) {
                var z = parseInt(groupName, 10);
                this._appendPorts(portsGropsByZ[groupName], z, elementReferences);
            }
        }

        this._updatePorts();
    },

    /**
     * @returns {V}
     * @private
     */
    _getContainerElement: function() {

        return this.rotatableNode || this.vel;
    },

    /**
     * @param {Array<Port>}ports
     * @param {number} z
     * @param refs
     * @private
     */
    _appendPorts: function(ports, z, refs) {

        var containerElement = this._getContainerElement();
        var portElements = util.toArray(ports).map(this._getPortElement, this);

        if (refs[z] || z < 0) {
            V(refs[Math.max(z, 0)]).before(portElements);
        } else {
            containerElement.append(portElements);
        }
    },

    /**
     * Try to get element from cache,
     * @param port
     * @returns {*}
     * @private
     */
    _getPortElement: function(port) {

        if (this._portElementsCache[port.id]) {
            return this._portElementsCache[port.id].portElement;
        }
        return this._createPortElement(port);
    },

    findPortNodes: function(portId, selector) {
        const portCache = this._portElementsCache[portId];
        if (!portCache) return [];
        if (!selector) return [portCache.portContentElement.node];
        const portRoot = portCache.portElement.node;
        const portSelectors = portCache.portSelectors;
        return this.findBySelector(selector, portRoot, portSelectors);
    },

    findPortNode: function(portId, selector) {
        const [node = null] = this.findPortNodes(portId, selector);
        return node;
    },

    /**
     * @private
     */
    _updatePorts: function() {

        // layout ports without group
        this._updatePortGroup(undefined);
        // layout ports with explicit group
        var groupsNames = Object.keys(this.model._portSettingsData.groups);
        groupsNames.forEach(this._updatePortGroup, this);
    },

    /**
     * @private
     */
    _removePorts: function() {
        util.invoke(this._portElementsCache, 'portElement.remove');
    },

    /**
     * @param {Port} port
     * @returns {V}
     * @private
     */
    _createPortElement: function(port) {

        let portElement;
        let labelElement;
        let labelSelectors;
        let portSelectors;

        var portContainerElement = V(this.portContainerMarkup).addClass('joint-port');

        var portMarkup = this._getPortMarkup(port);
        if (Array.isArray(portMarkup)) {
            var portDoc = this.parseDOMJSON(portMarkup, portContainerElement.node);
            var portFragment = portDoc.fragment;
            if (portFragment.childNodes.length > 1) {
                portElement = V('g').append(portFragment);
            } else {
                portElement = V(portFragment.firstChild);
            }
            portSelectors = portDoc.selectors;
        } else {
            portElement = V(portMarkup);
            if (Array.isArray(portElement)) {
                portElement = V('g').append(portElement);
            }
        }

        if (!portElement) {
            throw new Error('ElementView: Invalid port markup.');
        }

        portElement.attr({
            'port': port.id,
            'port-group': port.group
        });

        // If the port ID is a number, we need to add
        // extra information to the port element to distinguish
        // between ports with the same ID but different types.
        if (util.isNumber(port.id)) {
            portElement.attr('port-id-type', 'number');
        }

        const labelMarkupDef = this._getPortLabelMarkup(port.label);
        if (Array.isArray(labelMarkupDef)) {
            // JSON Markup
            const { fragment, selectors } = this.parseDOMJSON(labelMarkupDef, portContainerElement.node);
            const childCount = fragment.childNodes.length;
            if (childCount > 0) {
                labelSelectors = selectors;
                labelElement = (childCount === 1) ? V(fragment.firstChild) : V('g').append(fragment);
            }
        } else {
            // String Markup
            labelElement = V(labelMarkupDef);
            if (Array.isArray(labelElement)) {
                labelElement = V('g').append(labelElement);
            }
        }

        var portContainerSelectors;
        if (portSelectors && labelSelectors) {
            for (var key in labelSelectors) {
                if (portSelectors[key] && key !== this.selector) throw new Error('ElementView: selectors within port must be unique.');
            }
            portContainerSelectors = util.assign({}, portSelectors, labelSelectors);
        } else {
            portContainerSelectors = portSelectors || labelSelectors || {};
        }

        // The `portRootSelector` points to the root SVGNode of the port.
        // Either the implicit wrapping group <g/> in case the port consist of multiple SVGNodes.
        // Or the single SVGNode of the port.
        const portRootSelector = 'portRoot';
        // The `labelRootSelector` points to the root SVGNode of the label.
        const labelRootSelector = 'labelRoot';
        // The `labelTextSelector` points to all text SVGNodes of the label.
        const labelTextSelector = 'labelText';

        if (!(portRootSelector in portContainerSelectors)) {
            portContainerSelectors[portRootSelector] = portElement.node;
        }

        if (labelElement) {
            const labelNode = labelElement.node;
            if (!(labelRootSelector in portContainerSelectors)) {
                portContainerSelectors[labelRootSelector] = labelNode;
            }
            if (!(labelTextSelector in portContainerSelectors)) {
                // If the label is a <text> element, we can use it directly.
                // Otherwise, we need to find the <text> element within the label.
                const labelTextNode = (labelElement.tagName() === 'TEXT')
                    ? labelNode
                    : Array.from(labelNode.querySelectorAll('text'));
                portContainerSelectors[labelTextSelector] = labelTextNode;
                if (!labelSelectors) labelSelectors = {};
                labelSelectors[labelTextSelector] = labelTextNode;
            }
        }

        portContainerElement.append(portElement.addClass('joint-port-body'));
        if (labelElement) {
            portContainerElement.append(labelElement.addClass('joint-port-label'));
        }

        this._portElementsCache[port.id] = {
            portElement: portContainerElement,
            portLabelElement: labelElement,
            portSelectors: portContainerSelectors,
            portLabelSelectors: labelSelectors,
            portContentElement: portElement,
            portContentSelectors: portSelectors
        };

        return portContainerElement;
    },

    /**
     * @param {string=} groupName
     * @private
     */
    _updatePortGroup: function(groupName) {

        const portsMetrics = this.model.getGroupPortsMetrics(groupName);
        const portsIds = Object.keys(portsMetrics);

        for (let i = 0, n = portsIds.length; i < n; i++) {
            const portId = portsIds[i];
            const metrics = portsMetrics[portId];
            const cached = this._portElementsCache[portId] || {};
            const portTransformation = metrics.portTransformation;
            const labelTransformation = metrics.labelTransformation;
            if (labelTransformation && cached.portLabelElement) {
                this.updateDOMSubtreeAttributes(cached.portLabelElement.node, labelTransformation.attrs, {
                    rootBBox: new Rect(metrics.labelSize),
                    selectors: cached.portLabelSelectors
                });
                this.applyPortTransform(cached.portLabelElement, labelTransformation, (-portTransformation.angle || 0));
            }
            this.updateDOMSubtreeAttributes(cached.portElement.node, metrics.portAttrs, {
                rootBBox: new Rect(metrics.portSize),
                selectors: cached.portSelectors
            });
            this.applyPortTransform(cached.portElement, portTransformation);
        }
    },

    /**
     * @param {Vectorizer} element
     * @param {{dx:number, dy:number, angle: number, attrs: Object, x:number: y:number}} transformData
     * @param {number=} initialAngle
     * @constructor
     */
    applyPortTransform: function(element, transformData, initialAngle) {

        var matrix = V.createSVGMatrix()
            .rotate(initialAngle || 0)
            .translate(transformData.x || 0, transformData.y || 0)
            .rotate(transformData.angle || 0);

        element.transform(matrix, { absolute: true });
    },

    /**
     * @param {Port} port
     * @returns {string}
     * @private
     */
    _getPortMarkup: function(port) {

        return port.markup || this.model.get('portMarkup') || this.model.portMarkup || this.portMarkup;
    },

    /**
     * @param {Object} label
     * @returns {string}
     * @private
     */
    _getPortLabelMarkup: function(label) {

        return label.markup || this.model.get('portLabelMarkup') || this.model.portLabelMarkup || this.portLabelMarkup;
    }
};
