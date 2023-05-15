(function(joint, util, V) {

    var Element = joint.dia.Element;
    var ElementView = joint.dia.ElementView;

    Element.define('html.Element', {
        size: { width: 250, height: 228 },
        fields: {
            header: 'Task',
            name: '',
            resource: '',
            state: ''
        },
        attrs: {
            placeholder: {
                width: 'calc(w)',
                height: 'calc(h)',
                fill: 'transparent',
                stroke: '#D4D4D4'
            }
        }
    }, {

        htmlMarkup: util.svg`
            <foreignObject>
                <div @selector="htmlRoot" @group-selector="field" xmlns="http://www.w3.org/1999/xhtml"
                    class="html-element"
                    style="position: absolute; pointer-events: auto; user-select: none; box-sizing: border-box;"
                    data-attribute="state"
                >
                    <label @group-selector="field" class="html-element-header" data-attribute="header"></label>
                    <label class="html-element-label">Name
                        <input @group-selector="field" class="html-element-field" data-attribute="name" placeholder="Name" style="pointer-events: auto;" />
                    </label>
                    <label class="html-element-label">Resource
                        <select @group-selector="field" class="html-element-field" data-attribute="resource" style="pointer-events: auto;">
                            <option value="" disabled="true">Resource</option>
                            <option value="john">John</option>
                            <option value="mary">Mary</option>
                            <option value="bob">Bob</option>
                        </select>
                    </label>
                </div>
            </foreignObject>
        `,

        markup: util.svg`
            <rect @selector="placeholder" />
        `,
    });

    // Custom view for JointJS HTML element that displays an HTML <div></div> above the SVG Element.
    joint.shapes.html.ElementView = ElementView.extend({

        html: null,

        presentationAttributes: ElementView.addPresentationAttributes({
            position: ['HTML_UPDATE'],
            size: ['HTML_UPDATE'],
            fields: ['HTML_FIELD_UPDATE'],
            z: ['HTML_Z_INDEX']
        }),

        // Run these upon first render
        initFlag: ElementView.prototype.initFlag.concat([
            'HTML_UPDATE',
            'HTML_FIELD_UPDATE',
            'HTML_Z_INDEX'
        ]),

        confirmUpdate: function() {
            var flags = ElementView.prototype.confirmUpdate.apply(this, arguments);
            if (this.hasFlag(flags, 'HTML_UPDATE')) {
                this.updateHTML();
                flags = this.removeFlag(flags, 'HTML_UPDATE');
            }
            if (this.hasFlag(flags, 'HTML_FIELD_UPDATE')) {
                this.updateFields();
                flags = this.removeFlag(flags, 'HTML_FIELD_UPDATE');
            }
            if (this.hasFlag(flags, 'HTML_Z_INDEX')) {
                this.updateZIndex();
                flags = this.removeFlag(flags, 'HTML_Z_INDEX');
            }
            return flags;
        },

        onRender: function() {
            this.removeHTMLMarkup();
            this.renderHTMLMarkup();
            return this;
        },

        renderHTMLMarkup: function() {
            var doc = util.parseDOMJSON(this.model.htmlMarkup, V.namespace.xhtml);
            var html = doc.selectors.htmlRoot;
            var fields = doc.groupSelectors.field;
            // React on all box changes. e.g. input change
            html.addEventListener('change', this.onFieldChange.bind(this), false);
            this.paper.htmlContainer.appendChild(html);
            this.html = html;
            this.fields = fields;
            html.setAttribute('model-id', this.model.id);
        },

        removeHTMLMarkup: function() {
            var html = this.html;
            if (!html) return;
            this.paper.htmlContainer.removeChild(html);
            this.html = null;
            this.fields = null;
        },

        updateHTML: function() {
            var bbox = this.model.getBBox();
            var html = this.html;
            html.style.width = bbox.width + 'px';
            html.style.height = bbox.height + 'px';
            html.style.left = bbox.x + 'px';
            html.style.top = bbox.y + 'px';
        },

        onFieldChange: function(evt) {
            var input = evt.target;
            var attribute = input.dataset.attribute;
            if (attribute) {
                this.model.prop(['fields', attribute], input.value);
            }
        },

        updateFields: function() {
            this.fields.forEach(function(field) {
                var attribute = field.dataset.attribute;
                var value = this.model.prop(['fields', attribute]);
                switch (field.tagName.toUpperCase()) {
                    case 'LABEL':
                        field.textContent = value;
                        break;
                    case 'INPUT':
                    case 'SELECT':
                        field.value = value;
                        if (value) {
                            field.classList.remove('field-empty');
                        } else {
                            field.classList.add('field-empty');
                        }
                        break;
                    case 'DIV':
                        field.dataset[attribute] = value;
                        break;
                }
            }.bind(this));
        },

        updateZIndex: function() {
            this.html.style.zIndex = this.model.get('z') || 0;
        },

        onRemove: function() {
            this.removeHTMLMarkup();
        }
    });

})(joint, joint.util, V);
