(function(joint, _) {

    var PortData = function(data) {

        this.ports = {};
        this.groups = this._getNormalizedGroups(data);

        this._init(data);
    };

    PortData.prototype = {

        getPorts: function() {
            return this.ports;
        },

        getPort: function(id) {
            return this.ports[id];
        },

        getGroup: function(name) {
            return this.groups[name] || this._createGroupNode();
        },

        addPort: function(port) {
            port = this._evaluatePort(port);
            this.ports[port.id] = port;
        },

        _init: function(data) {

            data = data || {};

            var ports = data.items || [];

            _.each(ports, function(port) {

                this.addPort(port);
            }, this);
        },

        _evaluatePort: function(port) {

            var evaluated = _.clone(port);

            var group = _.extend(this._createGroupNode(), port.group ? this.groups[port.group] : null);

            evaluated.markup = evaluated.markup || group.markup;
            evaluated.attrs = _.merge({}, group.attrs, evaluated.attrs);
            evaluated.position = _.merge(this._createPositionNode(), group.position, { args: evaluated.args });
            evaluated.label = _.merge({}, group.label, this._getLabel(evaluated));

            return evaluated;
        },

        _createPositionNode: function() {

            return {
                name: 'left',
                args: {}
            };
        },

        _createGroupNode: function() {

            return {
                position: {},
                label: { position: { name: 'left', args: {} } }
            };
        },

        _getNormalizedGroups: function(data) {

            data = data || {};
            data.groups = data.groups || {};

            _.each(data.groups, function(group) {
                group.position = this._getPosition(group.position, true);
                group.label = this._getLabel(group, true);
            }, this);

            return data.groups;
        },

        _getPosition: function(position, setDefault) {

            var args = {};
            var positionName;

            if (_.isFunction(position)) {
                positionName = 'fn';
                args.fn = position;
            } else if (_.isString(position)) {
                positionName = position;
            } else if (_.isUndefined(position)) {
                positionName = setDefault ? 'left' : null;
            } else if (_.isArray(position)) {
                positionName = 'absolute';
                args.x = position[0];
                args.y = position[1];
            } else if (_.isObject(position)) {
                positionName = position.name;
                _.extend(args, position.args);
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

    _.extend(joint.dia.Element.prototype, {

        _initializePorts: function() {

            this._createPortData();
            this.on('change:ports', function() {

                this._processRemovedPort();
                this._createPortData();
            }, this);
        },

        _processRemovedPort: function() {

            var current = this.get('ports') || {};
            var currentItemsMap = {};

            _.each(current.items, function(item) {
                currentItemsMap[item.id] = true;
            });

            var previous = this.previous('ports') || {};
            var removed = {};

            _.each(previous.items, function(item) {
                if (!currentItemsMap[item.id]) {
                    removed[item.id] = true;
                }
            });

            var graph = this.graph;
            if (graph && !_.isEmpty(removed)) {

                var inboundLinks = graph.getConnectedLinks(this, { inbound: true });
                _.each(inboundLinks, function(link) {

                    if (removed[link.get('target').port]) link.remove();
                });

                var outboundLinks = graph.getConnectedLinks(this, { outbound: true });
                _.each(outboundLinks, function(link) {

                    if (removed[link.get('source').port]) link.remove();
                });
            }
        },

        hasPorts: function() {

            return this.getPorts().length > 0;
        },

        getPorts: function() {

            return _.cloneDeep(this.prop('ports/items')) || [];
        },

        getPort: function(id) {

            return _.find(this.getPorts(), function(port) {
                return port.id && port.id === id;
            });
        },

        getPortIndex: function(id) {

            return _.findIndex(this.getPorts(), function(port) {
                return port.id && port.id === id;
            });
        },

        addPort: function(port, opt) {

            var ports = _.clone(this.prop('ports/items')) || [];
            ports.push(port || {});
            this.prop('ports/items', ports, opt);

            return this;
        },

        _validatePorts: function() {

            var portsAttr = this.get('ports') || {};

            var errorMessages = [];
            portsAttr = portsAttr || {};
            var ports = portsAttr.items || [];

            _.each(ports, function(p) {
                if (!p.id) {
                    p.id = joint.util.uuid();
                }
            }, this);

            if (_.uniq(ports, 'id').length !== ports.length) {
                errorMessages.push('Element: found id duplicities in ports.');
            }

            return errorMessages;
        },

        addPorts: function(ports, opt) {

            if (ports.length) {
                this.prop('ports/items', this.getPorts().concat(ports), opt);
            }

            return this;
        },

        removePort: function(port, opt) {

            opt = opt || {};
            var ports = this.getPorts();

            var index = _.isString(port) ? _.findIndex(ports, this.getPort(port)) : _.findIndex(ports, port);

            if (index !== -1) {
                ports.splice(index, 1);
                opt.rewrite = true;
                this.prop('ports/items', ports, opt);
            }

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

            this.portData = new PortData(this.get('ports'));
        }
    });

    _.extend(joint.dia.ElementView.prototype, {

        portContainerMarkup: '<g class="port"/>',
        portMarkup: '<circle class="base-port" r="10" fill="#000000"/>',
        portLabelMarkup: '<text class="label"/>',
        /** @type {Object<string, {portElement: Vectorizer, portLabelElement: Vectorizer}>} */
        _portElementsCache: null,

        /**
         * @private
         */
        _initializePorts: function() {

            this._portElementsCache = {};

            this.listenTo(this.model, 'change:ports', function() {

                this._refreshPorts();
            });
        },

        /**
         * @typedef {Object} Port
         *
         * @property {string} id
         * @property {Object} position
         * @property {Object} label
         * @property {Object} attrs
         * @property {string} markup
         */

        /**
         * @private
         */
        _refreshPorts: function() {

            this._removePorts();
            this._portElementsCache = {};

            this._renderPorts();
        },

        /**
         * @private
         */
        _renderPorts: function() {

            var ports = _.groupBy(this.model.portData.getPorts(), 'z');

            _.eachRight(_.keys(ports), function(groupName) {
                this._appendPorts(ports[groupName], parseInt(groupName, 10));
            }, this);

            this._updatePorts();
        },

        /**
         * @param {Array<Port>}ports
         * @param {number} z
         * @private
         */
        _appendPorts: function(ports, z) {

            var containerElement = this.rotatableNode || this.vel;
            var childNodes = containerElement.node.childNodes;

            var getPortElement = function(port) {
                if (this._portElementsCache[port.id]) {
                    return this._portElementsCache[port.id].portElement;
                }
                return this._createPortElement(port);
            };

            var portElements = _.map(ports, getPortElement, this);

            if (childNodes[z]) {
                V(childNodes[z]).before(portElements);
            } else {
                containerElement.append(portElements);
            }
        },

        /**
         * @private
         */
        _updatePorts: function() {

            var elBBox = g.rect(this.model.get('size'));
            var ports = this.model.portData.getPorts();

            _.each(_.groupBy(ports, 'group'), function(ports, groupName) {

                var group = this.model.portData.getGroup(groupName);
                _.each(ports, this._updatePortAttrs, this);
                this._layoutPorts(ports, group, elBBox.clone());
            }, this);
        },

        /**
         * @private
         */
        _removePorts: function() {
            _.invoke(this._portElementsCache, 'portElement.remove');
        },

        /**
         * @param {Port} port
         * @returns {V}
         * @private
         */
        _createPortElement: function(port) {

            var portContentElement = V(this._getPortMarkup(port));
            var portLabelContentElement = V(this._getPortLabelMarkup(port.label));

            if (portContentElement && portContentElement.length > 1) {
                throw new Error('ElementView: Invalid port markup - multiple roots.');
            }

            portContentElement.attr('port', port.id);

            var portElement = V(this.portContainerMarkup)
                .append(portContentElement)
                .append(portLabelContentElement);

            this._portElementsCache[port.id] = {
                portElement: portElement,
                portLabelElement: portLabelContentElement
            };

            return portElement;
        },

        /**
         * @param {Port} port
         * @private
         */
        _updatePortAttrs: function(port) {

            var allAttrs = port.attrs || {};
            var element = this._portElementsCache[port.id];

            if (!element) {
                return;
            }

            this._updateAllAttrs(element.portElement.node, allAttrs);
        },

        /**
         * @param {Element} element
         * @param {Object} allAttrs
         * @private
         */
        _updateAllAttrs: function(element, allAttrs) {

            _.each(allAttrs, function(attrs, selector) {

                var $selected = selector === '.' ? $(element) : $(element).find(selector);
                this.updateAttr($selected, attrs);

            }, this);
        },

        /**
         * @param {Array<Port>} ports
         * @param {object} group
         * @param {g.rect} elBBox
         * @private
         */
        _layoutPorts: function(ports, group, elBBox) {

            var position = group.position.name;
            var namespace = joint.layout.Port;
            if (!namespace[position]) {
                position = 'left';
            }

            var offsets = namespace[position](_.pluck(ports, 'position.args'), elBBox, group);

            _.each(offsets, function(offset, index) {

                var port = this.model.portData.getPort(ports[index].id);
                var cached = this._portElementsCache[port.id] || {};

                this.applyPortTransform(cached.portElement, offset);

                var namespace = joint.layout.Label;
                var labelPosition = port.label.position.name;
                if (namespace[labelPosition]) {
                    var labelTrans = namespace[labelPosition](g.point(offset), elBBox, port.label.position.args);
                    this.applyPortTransform(cached.portLabelElement, labelTrans, -(offset.angle || 0));
                }
            }, this);
        },

        /**
         * @param {Vectorizer} element
         * @param {{x:number, y:number, angle: number, attrs: Object}} transformData
         * @param {number=} initialAngle
         * @constructor
         */
        applyPortTransform: function(element, transformData, initialAngle) {

            var matrix = V.createSVGMatrix()
                .rotate(initialAngle || 0)
                .translate(transformData.x || 0, transformData.y || 0)
                .rotate(transformData.angle || 0);

            element.transform(matrix, { absolute: true });
            this._updateAllAttrs(element.node, transformData.attrs || {});
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

    });
}(joint, _));
