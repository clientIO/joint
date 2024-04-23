import * as util from '../util/index.mjs';
import V from '../V/index.mjs';
import { Rect, Point } from '../g/index.mjs';
import * as Port from '../layout/ports/port.mjs';
import * as PortLabel from '../layout/ports/portLabel.mjs';

var PortData = function(data) {

    var clonedData = util.cloneDeep(data) || {};
    this.ports = [];
    this.groups = {};
    this.portLayoutNamespace = Port;
    this.portLabelLayoutNamespace = PortLabel;

    this._init(clonedData);
};

PortData.prototype = {

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

    getGroupPortsMetrics: function(groupName, elBBox) {

        var group = this.getGroup(groupName);
        var ports = this.getPortsByGroup(groupName);

        var groupPosition = group.position || {};
        var groupPositionName = groupPosition.name;
        var namespace = this.portLayoutNamespace;
        if (!namespace[groupPositionName]) {
            groupPositionName = 'left';
        }

        var groupArgs = groupPosition.args || {};
        var portsArgs = ports.map(function(port) {
            return port && port.position && port.position.args;
        });
        var groupPortTransformations = namespace[groupPositionName](portsArgs, elBBox, groupArgs);

        var accumulator = {
            ports: ports,
            result: []
        };

        util.toArray(groupPortTransformations).reduce(function(res, portTransformation, index) {
            var port = res.ports[index];
            res.result.push({
                portId: port.id,
                portTransformation: portTransformation,
                labelTransformation: this._getPortLabelLayout(port, Point(portTransformation), elBBox),
                portAttrs: port.attrs,
                portSize: port.size,
                labelSize: port.label.size
            });
            return res;
        }.bind(this), accumulator);

        return accumulator.result;
    },

    _getPortLabelLayout: function(port, portPosition, elBBox) {

        var namespace = this.portLabelLayoutNamespace;
        var labelPosition = port.label.position.name || 'left';

        if (namespace[labelPosition]) {
            return namespace[labelPosition](portPosition, elBBox, port.label.position.args);
        }

        return null;
    },

    _init: function(data) {

        // prepare groups
        if (util.isObject(data.groups)) {
            var groups = Object.keys(data.groups);
            for (var i = 0, n = groups.length; i < n; i++) {
                var key = groups[i];
                this.groups[key] = this._evaluateGroup(data.groups[key]);
            }
        }

        // prepare ports
        var ports = util.toArray(data.items);
        for (var j = 0, m = ports.length; j < m; j++) {
            this.ports.push(this._evaluatePort(ports[j]));
        }
    },

    _evaluateGroup: function(group) {

        return util.merge(group, {
            position: this._getPosition(group.position, true),
            label: this._getLabel(group, true)
        });
    },

    _evaluatePort: function(port) {

        var evaluated = util.assign({}, port);

        var group = this.getGroup(port.group);

        evaluated.markup = evaluated.markup || group.markup;
        evaluated.attrs = util.merge({}, group.attrs, evaluated.attrs);
        evaluated.position = this._createPositionNode(group, evaluated);
        evaluated.label = util.merge({}, group.label, this._getLabel(evaluated));
        evaluated.z = this._getZIndex(group, evaluated);
        evaluated.size = util.assign({}, group.size, evaluated.size);

        return evaluated;
    },

    _getZIndex: function(group, port) {

        if (util.isNumber(port.z)) {
            return port.z;
        }
        if (util.isNumber(group.z) || group.z === 'auto') {
            return group.z;
        }
        return 'auto';
    },

    _createPositionNode: function(group, port) {

        return util.merge({
            name: 'left',
            args: {}
        }, group.position, { args: port.args });
    },

    _getPosition: function(position, setDefault) {

        var args = {};
        var positionName;

        if (util.isFunction(position)) {
            positionName = 'fn';
            args.fn = position;
        } else if (util.isString(position)) {
            positionName = position;
        } else if (position === undefined) {
            positionName = setDefault ? 'left' : null;
        } else if (Array.isArray(position)) {
            positionName = 'absolute';
            args.x = position[0];
            args.y = position[1];
        } else if (util.isObject(position)) {
            positionName = position.name;
            util.assign(args, position.args);
        }

        var result = { args: args };

        if (positionName) {
            result.name = positionName;
        }
        return result;
    },

    _getLabel: function(item, setDefaults) {

        var label = item.label || {};

        var ret = label;
        ret.position = this._getPosition(label.position, setDefaults);

        return ret;
    }
};

export const elementPortPrototype = {

    _initializePorts: function() {

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

        var ports = this.prop('ports/items');
        return Array.isArray(ports) && ports.length > 0;
    },

    /**
     * @param {string} id
     * @returns {boolean}
     */
    hasPort: function(id) {

        return this.getPortIndex(id) !== -1;
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

        return util.cloneDeep(util.toArray(this.prop('ports/items')).find(function(port) {
            return port.id && port.id === id;
        }));
    },

    /**
     * @param {string} groupName
     * @returns {Object<portId, {x: number, y: number, angle: number}>}
     */
    getPortsPositions: function(groupName) {

        var portsMetrics = this._portSettingsData.getGroupPortsMetrics(groupName, Rect(this.size()));

        return portsMetrics.reduce(function(positions, metrics) {
            var transformation = metrics.portTransformation;
            positions[metrics.portId] = {
                x: transformation.x,
                y: transformation.y,
                angle: transformation.angle
            };
            return positions;
        }, {});
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

        this._portSettingsData = new PortData(this.get('ports'));

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

        var elementBBox = Rect(this.model.size());
        var portsMetrics = this.model._portSettingsData.getGroupPortsMetrics(groupName, elementBBox);

        for (var i = 0, n = portsMetrics.length; i < n; i++) {
            var metrics = portsMetrics[i];
            var portId = metrics.portId;
            var cached = this._portElementsCache[portId] || {};
            var portTransformation = metrics.portTransformation;
            var labelTransformation = metrics.labelTransformation;
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

