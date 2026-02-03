
import { shapes as defaultShapes, dia } from '@joint/core';
import { AdaptiveCard, HostConfig, SubmitAction, OpenUrlAction } from 'adaptivecards';
import './styles.css';

const shapes = { ...defaultShapes };

const AdaptiveCardModel = dia.Element.define('AdaptiveCardModel', {
    size: { width: 300, height: 0 },
    z: 1,
    template: null,
    border: '2px solid #ddd',
});
shapes.AdaptiveCardModel = AdaptiveCardModel;

const ACFlags = {
    // RenderView is used to render the adaptive card inside the foreign object
    RenderView: '@render-view',
    // UpdateView is used to update the size of the foreign object
    // and the color of border
    UpdateView: '@update-view',
    // TransformView is used to position and rotate the view
    TransformView: '@transform-view',
    // MeasureView is used to measure the view and update
    // the size of the model
    MeasureView: '@measure-view'
};

// The `AdaptiveCardModelView` is a custom view for the `AdaptiveCardModel` model.
// It is responsible for rendering the adaptive card inside the foreign object.
// It is located in the same namespace as the model so that it is automatically
// used when the model is added to the graph.
// The convention is to name the view as `[-model-name-]View`.
shapes.AdaptiveCardModelView = dia.ElementView.extend({

    // The root of the element view is the <g> element by default.
    tagName: 'foreignObject',

    // Whenever the model attributes change (the map key is the attribute name),
    // the update flag will be reported to the paper and on the next frame of the animation
    // the update() method will be called, which will contain all the flags that were reported.
    presentationAttributes: {
        size: [ACFlags.UpdateView],
        position: [ACFlags.TransformView],
        angle: [ACFlags.TransformView],
        template: [ACFlags.RenderView],
        border: [ACFlags.UpdateView],
    },

    // The initFlag property is a list of flags that will be reported to the paper
    // when the element view is initialized.
    initFlag: [ACFlags.RenderView, ACFlags.UpdateView, ACFlags.TransformView, ACFlags.MeasureView],

    confirmUpdate: function(flags) {
        if (this.hasFlag(flags, ACFlags.RenderView)) this.render();
        if (this.hasFlag(flags, ACFlags.UpdateView)) this.update();
        // `updateTransformation` is the original method of the `dia.ElementView`
        // it applies the `transform` attribute to the root element i.e. the `<foreignObject>`
        if (this.hasFlag(flags, ACFlags.TransformView)) this.updateTransformation();
        if (this.hasFlag(flags, ACFlags.MeasureView)) this.resizeModel();
    },

    init: function() {
        // Create an AdaptiveCard instance
        const adaptiveCard = new AdaptiveCard();
        // Set the host styling
        adaptiveCard.hostConfig = acHostConfig;
        // Set the adaptive card's event handlers. onExecuteAction is invoked
        // whenever an action is clicked in the card
        adaptiveCard.onExecuteAction = (action) => this.onExecuteAction(action);
        // Keep a reference to the AdaptiveCard instance
        this.adaptiveCard = adaptiveCard;
        // Create a ResizeObserver to measure the card's size
        this.resizeObserver = new ResizeObserver(() => this.requestMeasurement());
    },

    onExecuteAction: function(action) {
        if (action instanceof SubmitAction) {
            this.notify('element:submit', action.data);
        }
        if (action instanceof OpenUrlAction) {
            this.notify('element:open-url', action.url);
        }
    },

    onRemove() {
        this.releaseResources();
    },

    releaseResources() {
        const { el, adaptiveCard, resizeObserver } = this;
        if (!adaptiveCard.renderedElement) return;
        el.removeChild(adaptiveCard.renderedElement);
        adaptiveCard.releaseDOMResources();
        resizeObserver.disconnect();
    },

    render: function() {
        const { el, model, adaptiveCard, resizeObserver } = this;
        this.releaseResources();
        // Parse the card payload
        adaptiveCard.parse(model.get('template'));
        // Render the card to an HTML element:
        const cardEl = adaptiveCard.render();
        el.appendChild(cardEl);
        // Observe the card's size changes
        resizeObserver.observe(cardEl);
    },

    requestMeasurement(opt = {}) {
        this.requestUpdate(this.getFlag(ACFlags.MeasureView), opt);
    },

    resizeModel() {
        const { model, adaptiveCard } = this;
        if (!adaptiveCard.renderedElement) return;
        const { width, height } = model.size();
        const acHeight = adaptiveCard.renderedElement.offsetHeight;
        if (height === acHeight) return;
        // Resize the model to fit the rendered card.
        // Note that the model is resized only vertically.
        // We pass the view id to the resize method to make it possible
        // this event to be ignored by for instance the command manager (undo/redo)
        // which is not interested in this event.
        //
        // new ui.CommandManager({
        //   graph,
        //   cmdBeforeAdd: (...args: any[]) => {
        //     const options = args[args.length - 1];
        //     if (options.view) return false;
        //     return true;
        //   }
        // });
        model.resize(width, acHeight, { view: this.cid });
        this.update();
    },

    update: function() {
        const { el, model, adaptiveCard } = this;
        // Set the size of the <foreignObject> element.
        const { width, height } = model.size();
        el.setAttribute('width', width);
        el.setAttribute('height', height);
        // Set the border of the card.
        adaptiveCard.renderedElement.style.border = model.get('border');
        // Clean the cache of the nodes that are used to render the card
        // (the cache contains the position and size of the nodes that could
        // have been changed during the resize of the card).
        this.cleanNodesCache();
    }
});

var graph = new dia.Graph({}, { cellNamespace: shapes });
var paper = new dia.Paper({
    el: document.getElementById('paper'),
    width: 1800,
    height: 1000,
    model: graph,
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    overflow: true,
    interactive: { linkMove: false },
    cellViewNamespace: shapes,
    defaultAnchor: {
        name: 'modelCenter',
    },
    defaultConnectionPoint: {
        name: 'rectangle',
    },
    defaultConnector: {
        name: 'curve',
    },
    preventDefaultViewAction: false,
    background: { color: 'transparent' }
});

// Set its hostConfig property unless you want to use the default Host Config
// Host Config defines the style and behavior of a card
// See: https://learn.microsoft.com/en-us/adaptive-cards/rendering-cards/host-config
const acHostConfig = new HostConfig({
    fontFamily: 'Segoe UI, Helvetica Neue, sans-serif',
    containerStyles: {
        default: {
            backgroundColor: '#FFFFFF',
            foregroundColors: {
                default: {
                    default: '#333333',
                    subtle: '#484644',
                },
                accent: {
                    default: '#2E89FC',
                    subtle: '#0078D4'
                },
                attention: {
                    default: '#D13438',
                    subtle: '#A4262C'
                },
                dark: {
                    default: '#000000',
                    subtle: '#646464'
                },
                good: {
                    default: '#0B6A0B',
                    subtle: '#028A02'
                },
                light: {
                    default: '#FFFFFF',
                    subtle: '#E6E6E6'
                },
                warning: {
                    default: '#B75C00',
                    subtle: '#986F0B'
                }
            }
        },
        emphasis: {
            backgroundColor: '#F2F2F2',
            foregroundColors: {
                default: {
                    default: '#000000',
                    subtle: '#484644'
                }
            }
        },
        accent: {
            backgroundColor: '#C7DEF9',
            foregroundColors: {
                default: {
                    default: '#333333',
                    subtle: '#484644'
                }
            }
        },
        good: {
            backgroundColor: '#CCFFCC',
            foregroundColors: {
                default: {
                    default: '#333333',
                    subtle: '#484644'
                }
            }
        },
        attention: {
            backgroundColor: '#FFC5B2',
            foregroundColors: {
                default: {
                    default: '#333333',
                    subtle: '#484644'
                }
            }
        },
        warning: {
            backgroundColor: '#FFE2B2',
            foregroundColors: {
                default: {
                    default: '#333333',
                    subtle: '#484644'
                }
            }
        }
    },
    supportsInteractivity: true,
    imageSizes: {
        small: 40,
        medium: 80,
        large: 160
    },
    actions: {
        actionAlignment: 'stretch',
        actionsOrientation: 'vertical',
        buttonSpacing: 8,
        maxActions: 100,
        showCard: {
            actionMode: 'inline',
            inlineTopMargin: 8
        },
        spacing: 'default'
    },
    adaptiveCard: {
        allowCustomStyle: false
    },
    imageSet: {
        imageSize: 'medium',
        maxImageHeight: 100
    },
    factSet: {
        title: {
            color: 'default',
            size: 'default',
            isSubtle: false,
            weight: 'bolder',
            wrap: true,
            maxWidth: 150
        },
        value: {
            color: 'default',
            size: 'default',
            isSubtle: false,
            weight: 'default',
            wrap: true
        },
        spacing: 8
    },
    textBlock: {
        headingLevel: 1
    }
});

// https://adaptivecards.io/samples/ActivityUpdate.html
const activity = new AdaptiveCardModel({
    id: 'activity-update',
    position: { x: 550, y: 0 },
    size: { width: 300, height: 0 },
    template: {
        '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
        'type': 'AdaptiveCard',
        'version': '1.5',
        'body': [
            {
                'type': 'TextBlock',
                'text': 'activity Adaptive Card schema',
                'weight': 'bolder',
                'size': 'medium',
                'wrap': true,
                'style': 'heading'
            },
            {
                'type': 'ColumnSet',
                'columns': [
                    {
                        'type': 'Column',
                        'width': 'auto',
                        'items': [
                            {
                                'type': 'Image',
                                'url': 'https://pbs.twimg.com/profile_images/3647943215/d7f12830b3c17a5a9e4afcc370e3a37e_400x400.jpeg',
                                'altText': 'Matt Hidinger',
                                'size': 'small',
                                'style': 'person'
                            }
                        ]
                    },
                    {
                        'type': 'Column',
                        'width': 'stretch',
                        'items': [
                            {
                                'type': 'TextBlock',
                                'text': 'Matt Hidinger',
                                'weight': 'bolder',
                                'wrap': true
                            },
                            {
                                'type': 'TextBlock',
                                'spacing': 'none',
                                'text': 'Created {{DATE(2017-02-14T06:08:39Z, SHORT)}}',
                                'isSubtle': true,
                                'wrap': true
                            }
                        ]
                    }
                ]
            },
            {
                'type': 'TextBlock',
                'text': 'Now that we have defined the main rules and features of the format, we need to produce a schema and activity it to GitHub. The schema will be the starting point of our reference documentation.',
                'wrap': true
            },
            {
                'type': 'FactSet',
                'facts': [
                    {
                        'title': 'Board:',
                        'value': 'Adaptive Card'
                    },
                    {
                        'title': 'List:',
                        'value': 'Backlog'
                    },
                    {
                        'title': 'Assigned to:',
                        'value': 'Matt Hidinger'
                    },
                    {
                        'title': 'Due date:',
                        'value': 'Not set'
                    }
                ]
            }
        ],
        'actions': [
            {
                'type': 'Action.ShowCard',
                'title': 'Set due date',
                'card': {
                    'type': 'AdaptiveCard',
                    'body': [
                        {
                            'type': 'Input.Date',
                            'label': 'Enter the due date',
                            'id': 'dueDate'
                        }
                    ],
                    'actions': [
                        {
                            'type': 'Action.Submit',
                            'title': 'Send'
                        }
                    ]
                }
            },
            {
                'type': 'Action.ShowCard',
                'title': 'Comment',
                'card': {
                    'type': 'AdaptiveCard',
                    'body': [
                        {
                            'type': 'Input.Text',
                            'id': 'comment',
                            'isMultiline': true,
                            'label': 'Add a comment'
                        }
                    ],
                    'actions': [
                        {
                            'type': 'Action.Submit',
                            'title': 'OK'
                        }
                    ]
                }
            }
        ]
    }
});

// https://adaptivecards.io/samples/Agenda.html
const agenda = new AdaptiveCardModel({
    id: 'todays-agenda',
    position: { x: 1250, y: 0 },
    size: { width: 500, height: 0 },
    template: {
        'type': 'AdaptiveCard',
        'body': [
            {
                'type': 'TextBlock',
                'text': 'Today\'s Agenda',
                'wrap': true,
                'style': 'heading'
            },
            {
                'type': 'ColumnSet',
                'horizontalAlignment': 'center',
                'columns': [
                    {
                        'type': 'Column',
                        'items': [
                            {
                                'type': 'ColumnSet',
                                'horizontalAlignment': 'center',
                                'columns': [
                                    {
                                        'type': 'Column',
                                        'items': [
                                            {
                                                'type': 'Image',
                                                'url': 'https://adaptivecards.io/content/LocationGreen_A.png',
                                                'altText': 'Location A'
                                            }
                                        ],
                                        'width': 'auto'
                                    },
                                    {
                                        'type': 'Column',
                                        'items': [
                                            {
                                                'type': 'TextBlock',
                                                'text': '**Redmond**',
                                                'wrap': true
                                            },
                                            {
                                                'type': 'TextBlock',
                                                'spacing': 'none',
                                                'text': '8a - 12:30p',
                                                'wrap': true
                                            }
                                        ],
                                        'width': 'auto'
                                    }
                                ]
                            }
                        ],
                        'width': 1
                    },
                    {
                        'type': 'Column',
                        'spacing': 'large',
                        'separator': true,
                        'items': [
                            {
                                'type': 'ColumnSet',
                                'horizontalAlignment': 'center',
                                'columns': [
                                    {
                                        'type': 'Column',
                                        'items': [
                                            {
                                                'type': 'Image',
                                                'url': 'https://adaptivecards.io/content/LocationBlue_B.png',
                                                'altText': 'Location B'
                                            }
                                        ],
                                        'width': 'auto'
                                    },
                                    {
                                        'type': 'Column',
                                        'items': [
                                            {
                                                'type': 'TextBlock',
                                                'text': '**Bellevue**',
                                                'wrap': true
                                            },
                                            {
                                                'type': 'TextBlock',
                                                'spacing': 'none',
                                                'text': '12:30p - 3p',
                                                'wrap': true
                                            }
                                        ],
                                        'width': 'auto'
                                    }
                                ]
                            }
                        ],
                        'width': 1
                    },
                    {
                        'type': 'Column',
                        'spacing': 'large',
                        'separator': true,
                        'items': [
                            {
                                'type': 'ColumnSet',
                                'horizontalAlignment': 'center',
                                'columns': [
                                    {
                                        'type': 'Column',
                                        'items': [
                                            {
                                                'type': 'Image',
                                                'url': 'https://adaptivecards.io/content/LocationRed_C.png',
                                                'altText': 'Location C'
                                            }
                                        ],
                                        'width': 'auto'
                                    },
                                    {
                                        'type': 'Column',
                                        'items': [
                                            {
                                                'type': 'TextBlock',
                                                'text': '**Seattle**',
                                                'wrap': true
                                            },
                                            {
                                                'type': 'TextBlock',
                                                'spacing': 'none',
                                                'text': '8p',
                                                'wrap': true
                                            }
                                        ],
                                        'width': 'auto'
                                    }
                                ]
                            }
                        ],
                        'width': 1
                    }
                ]
            },
            {
                'type': 'ColumnSet',
                'columns': [
                    {
                        'type': 'Column',
                        'items': [
                            {
                                'type': 'ColumnSet',
                                'columns': [
                                    {
                                        'type': 'Column',
                                        'items': [
                                            {
                                                'type': 'Image',
                                                'horizontalAlignment': 'left',
                                                'url': 'https://adaptivecards.io/content/conflict.png',
                                                'altText': 'Calendar conflict'
                                            }
                                        ],
                                        'width': 'auto'
                                    },
                                    {
                                        'type': 'Column',
                                        'spacing': 'none',
                                        'items': [
                                            {
                                                'type': 'TextBlock',
                                                'text': '2:00 PM',
                                                'wrap': true
                                            }
                                        ],
                                        'width': 'stretch'
                                    }
                                ]
                            },
                            {
                                'type': 'TextBlock',
                                'spacing': 'none',
                                'text': '1hr',
                                'isSubtle': true,
                                'wrap': true
                            }
                        ],
                        'width': '110px'
                    },
                    {
                        'type': 'Column',
                        'backgroundImage': {
                            'url': 'https://adaptivecards.io/content/SmallVerticalLineGray.png',
                            'fillMode': 'repeatVertically',
                            'horizontalAlignment': 'center'
                        },
                        'items': [
                            {
                                'type': 'Image',
                                'horizontalAlignment': 'center',
                                'url': 'https://adaptivecards.io/content/CircleGreen_coffee.png',
                                'altText': 'Location A: Coffee'
                            }
                        ],
                        'width': 'auto',
                        'spacing': 'none'
                    },
                    {
                        'type': 'Column',
                        'items': [
                            {
                                'type': 'TextBlock',
                                'text': '**Contoso Campaign Status Meeting**',
                                'wrap': true
                            },
                            {
                                'type': 'ColumnSet',
                                'spacing': 'none',
                                'columns': [
                                    {
                                        'type': 'Column',
                                        'items': [
                                            {
                                                'type': 'Image',
                                                'url': 'https://adaptivecards.io/content/location_gray.png',
                                                'altText': 'Location'
                                            }
                                        ],
                                        'width': 'auto'
                                    },
                                    {
                                        'type': 'Column',
                                        'items': [
                                            {
                                                'type': 'TextBlock',
                                                'text': 'Conf Room Bravern-2/9050',
                                                'wrap': true
                                            }
                                        ],
                                        'width': 'stretch'
                                    }
                                ]
                            },
                            {
                                'type': 'ImageSet',
                                'spacing': 'small',
                                'imageSize': 'small',
                                'images': [
                                    {
                                        'type': 'Image',
                                        'url': 'https://adaptivecards.io/content/person_w1.png',
                                        'size': 'small',
                                        'altText': 'Person with bangs'
                                    },
                                    {
                                        'type': 'Image',
                                        'url': 'https://adaptivecards.io/content/person_m1.png',
                                        'size': 'small',
                                        'altText': 'Person with glasses and short hair'
                                    },
                                    {
                                        'type': 'Image',
                                        'url': 'https://adaptivecards.io/content/person_w2.png',
                                        'size': 'small',
                                        'altText': 'Person smiling'
                                    }
                                ]
                            },
                            {
                                'type': 'ColumnSet',
                                'spacing': 'small',
                                'columns': [
                                    {
                                        'type': 'Column',
                                        'items': [
                                            {
                                                'type': 'Image',
                                                'url': 'https://adaptivecards.io/content/power_point.png',
                                                'altText': 'Powerpoint presentation'
                                            }
                                        ],
                                        'width': 'auto'
                                    },
                                    {
                                        'type': 'Column',
                                        'items': [
                                            {
                                                'type': 'TextBlock',
                                                'text': '**Contoso Brand Guidelines** shared by **Susan Metters**',
                                                'wrap': true
                                            }
                                        ],
                                        'width': 'stretch'
                                    }
                                ]
                            }
                        ],
                        'width': 40
                    }
                ]
            },
            {
                'type': 'ColumnSet',
                'spacing': 'none',
                'columns': [
                    {
                        'type': 'Column',
                        'width': '110px'
                    },
                    {
                        'type': 'Column',
                        'backgroundImage': {
                            'url': 'https://adaptivecards.io/content/SmallVerticalLineGray.png',
                            'fillMode': 'repeatVertically',
                            'horizontalAlignment': 'center'
                        },
                        'items': [
                            {
                                'type': 'Image',
                                'horizontalAlignment': 'center',
                                'url': 'https://adaptivecards.io/content/Gray_Dot.png',
                                'altText': 'In transit'
                            }
                        ],
                        'width': 'auto',
                        'spacing': 'none'
                    },
                    {
                        'type': 'Column',
                        'items': [
                            {
                                'type': 'ColumnSet',
                                'columns': [
                                    {
                                        'type': 'Column',
                                        'items': [
                                            {
                                                'type': 'Image',
                                                'url': 'https://adaptivecards.io/content/car.png',
                                                'altText': 'Travel by car'
                                            }
                                        ],
                                        'width': 'auto'
                                    },
                                    {
                                        'type': 'Column',
                                        'items': [
                                            {
                                                'type': 'TextBlock',
                                                'text': 'about 45 minutes',
                                                'isSubtle': true,
                                                'wrap': true
                                            }
                                        ],
                                        'width': 'stretch'
                                    }
                                ]
                            }
                        ],
                        'width': 40
                    }
                ]
            },
            {
                'type': 'ColumnSet',
                'spacing': 'none',
                'columns': [
                    {
                        'type': 'Column',
                        'items': [
                            {
                                'type': 'TextBlock',
                                'spacing': 'none',
                                'text': '8:00 PM',
                                'wrap': true
                            },
                            {
                                'type': 'TextBlock',
                                'spacing': 'none',
                                'text': '1hr',
                                'isSubtle': true,
                                'wrap': true
                            }
                        ],
                        'width': '110px'
                    },
                    {
                        'type': 'Column',
                        'backgroundImage': {
                            'url': 'https://adaptivecards.io/content/SmallVerticalLineGray.png',
                            'fillMode': 'repeatVertically',
                            'horizontalAlignment': 'center'
                        },
                        'items': [
                            {
                                'type': 'Image',
                                'horizontalAlignment': 'center',
                                'url': 'https://adaptivecards.io/content/CircleBlue_flight.png',
                                'altText': 'Location B: Flight'
                            }
                        ],
                        'width': 'auto',
                        'spacing': 'none'
                    },
                    {
                        'type': 'Column',
                        'items': [
                            {
                                'type': 'TextBlock',
                                'text': '**Alaska Airlines AS1021 flight to Chicago**',
                                'wrap': true
                            },
                            {
                                'type': 'ColumnSet',
                                'spacing': 'none',
                                'columns': [
                                    {
                                        'type': 'Column',
                                        'items': [
                                            {
                                                'type': 'Image',
                                                'url': 'https://adaptivecards.io/content/location_gray.png',
                                                'altText': 'Location'
                                            }
                                        ],
                                        'width': 'auto'
                                    },
                                    {
                                        'type': 'Column',
                                        'items': [
                                            {
                                                'type': 'TextBlock',
                                                'text': 'Seattle Tacoma International Airport (17801 International Blvd, Seattle, WA, United States)',
                                                'wrap': true
                                            }
                                        ],
                                        'width': 'stretch'
                                    }
                                ]
                            },
                            {
                                'type': 'Image',
                                'url': 'https://adaptivecards.io/content/SeaTacMap.png',
                                'size': 'Stretch',
                                'altText': 'Map of the Seattle-Tacoma airport'
                            }
                        ],
                        'width': 40
                    }
                ]
            }
        ],
        '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
        'version': '1.5'
    }
});

// https://adaptivecards.io/samples/WeatherLarge.html
const weather = new AdaptiveCardModel({
    id: 'weather',
    position: { x: 1250, y: 520 },
    template: {
        '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
        'type': 'AdaptiveCard',
        'version': '1.5',
        'speak': 'Weather forecast for Monday is high of 62 and low of 42 degrees with a 20% chance of rainWinds will be 5 mph from the northeast',
        'backgroundImage': 'https://adaptivecards.io/content/Mostly%20Cloudy-Background.jpg',
        'body': [
            {
                'type': 'ColumnSet',
                'columns': [
                    {
                        'type': 'Column',
                        'width': '35',
                        'items': [
                            {
                                'type': 'Image',
                                'url': 'https://adaptivecards.io/content/Mostly%20Cloudy-Square.png',
                                'size': 'stretch',
                                'altText': 'Mostly cloudy weather'
                            }
                        ]
                    },
                    {
                        'type': 'Column',
                        'width': '65',
                        'items': [
                            {
                                'type': 'TextBlock',
                                'text': 'Wed, Jun 14, 2023',
                                'weight': 'bolder',
                                'size': 'large',
                                'wrap': true,
                                'color': 'dark',
                                'style': 'heading'
                            },
                            {
                                'type': 'TextBlock',
                                'text': '32 / 50',
                                'size': 'medium',
                                'spacing': 'none',
                                'wrap': true,
                                'color': 'dark'
                            },
                            {
                                'type': 'TextBlock',
                                'text': '31% chance of rain',
                                'spacing': 'none',
                                'wrap': true,
                                'color': 'dark'
                            },
                            {
                                'type': 'TextBlock',
                                'text': 'Winds 4.4 mph SSE',
                                'spacing': 'none',
                                'wrap': true,
                                'color': 'dark'
                            }
                        ]
                    }
                ]
            },
            {
                'type': 'ColumnSet',
                'columns': [
                    {
                        'type': 'Column',
                        'width': '20',
                        'items': [
                            {
                                'type': 'TextBlock',
                                'horizontalAlignment': 'center',
                                'wrap': true,
                                'text': 'Wednesday',
                                'color': 'dark'
                            },
                            {
                                'type': 'Image',
                                'size': 'auto',
                                'url': 'https://adaptivecards.io/content/Drizzle-Square.png',
                                'altText': 'Drizzly weather'
                            },
                            {
                                'type': 'TextBlock',
                                'text': '**High**\t50',
                                'wrap': true,
                                'color': 'dark',
                                'horizontalAlignment': 'center'
                            },
                            {
                                'type': 'TextBlock',
                                'text': '**Low**\t32',
                                'wrap': true,
                                'color': 'dark',
                                'spacing': 'none',
                                'horizontalAlignment': 'center'
                            }
                        ],
                        'selectAction': {
                            'type': 'Action.OpenUrl',
                            'title': 'View Wednesday',
                            'url': 'https://www.microsoft.com'
                        }
                    },
                    {
                        'type': 'Column',
                        'width': '20',
                        'items': [
                            {
                                'type': 'TextBlock',
                                'horizontalAlignment': 'center',
                                'wrap': true,
                                'text': 'Thursday',
                                'color': 'dark'
                            },
                            {
                                'type': 'Image',
                                'size': 'auto',
                                'url': 'https://adaptivecards.io/content/Mostly%20Cloudy-Square.png',
                                'altText': 'Mostly cloudy weather'
                            },
                            {
                                'type': 'TextBlock',
                                'text': '**High**\t50',
                                'color': 'dark',
                                'wrap': true,
                                'horizontalAlignment': 'center'
                            },
                            {
                                'type': 'TextBlock',
                                'text': '**Low**\t32',
                                'wrap': true,
                                'color': 'dark',
                                'spacing': 'none',
                                'horizontalAlignment': 'center'
                            }
                        ],
                        'selectAction': {
                            'type': 'Action.OpenUrl',
                            'title': 'View Thursday',
                            'url': 'https://www.microsoft.com'
                        }
                    },
                    {
                        'type': 'Column',
                        'width': '20',
                        'items': [
                            {
                                'type': 'TextBlock',
                                'horizontalAlignment': 'center',
                                'wrap': true,
                                'text': 'Friday',
                                'color': 'dark'
                            },
                            {
                                'type': 'Image',
                                'size': 'auto',
                                'url': 'https://adaptivecards.io/content/Mostly%20Cloudy-Square.png',
                                'altText': 'Mostly cloudy weather'
                            },
                            {
                                'type': 'TextBlock',
                                'text': '**High**\t59',
                                'wrap': true,
                                'color': 'dark',
                                'horizontalAlignment': 'center'
                            },
                            {
                                'type': 'TextBlock',
                                'text': '**Low**\t32',
                                'wrap': true,
                                'color': 'dark',
                                'spacing': 'none',
                                'horizontalAlignment': 'center'
                            }
                        ],
                        'selectAction': {
                            'type': 'Action.OpenUrl',
                            'title': 'View Friday',
                            'url': 'https://www.microsoft.com'
                        }
                    },
                    {
                        'type': 'Column',
                        'width': '20',
                        'items': [
                            {
                                'type': 'TextBlock',
                                'horizontalAlignment': 'center',
                                'wrap': true,
                                'text': 'Saturday',
                                'color': 'dark'
                            },
                            {
                                'type': 'Image',
                                'size': 'auto',
                                'url': 'https://adaptivecards.io/content/Mostly%20Cloudy-Square.png',
                                'altText': 'Mostly cloudy weather'
                            },
                            {
                                'type': 'TextBlock',
                                'text': '**High**\t50',
                                'wrap': true,
                                'color': 'dark',
                                'horizontalAlignment': 'center'
                            },
                            {
                                'type': 'TextBlock',
                                'text': '**Low**\t32',
                                'wrap': true,
                                'color': 'dark',
                                'spacing': 'none',
                                'horizontalAlignment': 'center'
                            }
                        ],
                        'selectAction': {
                            'type': 'Action.OpenUrl',
                            'title': 'View Saturday',
                            'url': 'https://www.microsoft.com'
                        }
                    }
                ]
            }
        ]
    }
});

// https://adaptivecards.io/samples/ShowCardWizard.html
const wizard = new AdaptiveCardModel({
    id: 'card-wizard',
    position: { x: 900, y: 0 },
    template: {
        'type': 'AdaptiveCard',
        'version': '1.5',
        'body': [
            {
                'type': 'TextBlock',
                'text': 'Please provide the following information:',
                'wrap': true,
                'style': 'heading'
            }
        ],
        '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
        'actions': [
            {
                'type': 'Action.ShowCard',
                'title': '1. Name',
                'card': {
                    'type': 'AdaptiveCard',
                    '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
                    'body': [
                        {
                            'type': 'Container',
                            'style': 'positive',
                            'id': 'nameProperties',
                            'items': [
                                {
                                    'type': 'Input.Text',
                                    'label': 'First Name',
                                    'id': 'FirstName',
                                    'isRequired': true,
                                    'errorMessage': 'First Name is required'
                                },
                                {
                                    'type': 'Input.Text',
                                    'label': 'Middle Name',
                                    'id': 'MiddleName'
                                },
                                {
                                    'type': 'Input.Text',
                                    'label': 'Last Name',
                                    'id': 'LastName',
                                    'isRequired': true,
                                    'errorMessage': 'Last Name is required'
                                }
                            ]
                        }
                    ],
                    'actions': [
                        {
                            'type': 'Action.ShowCard',
                            'title': '2. Address',
                            'card': {
                                'type': 'AdaptiveCard',
                                '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
                                'body': [
                                    {
                                        'type': 'Container',
                                        'id': 'addressProperties',
                                        'items': [
                                            {
                                                'type': 'Input.Text',
                                                'label': 'Address line 1',
                                                'id': 'AddressLine1'
                                            },
                                            {
                                                'type': 'Input.Text',
                                                'label': 'Address line 2',
                                                'id': 'AddressLine2'
                                            },
                                            {
                                                'type': 'ColumnSet',
                                                'columns': [
                                                    {
                                                        'type': 'Column',
                                                        'width': 'stretch',
                                                        'items': [
                                                            {
                                                                'type': 'Input.Text',
                                                                'label': 'City',
                                                                'id': 'City'
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        'type': 'Column',
                                                        'width': 'stretch',
                                                        'items': [
                                                            {
                                                                'type': 'Input.Text',
                                                                'label': 'State',
                                                                'id': 'State'
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        'type': 'Column',
                                                        'width': 'stretch',
                                                        'items': [
                                                            {
                                                                'type': 'Input.Text',
                                                                'label': 'Zip Code',
                                                                'id': 'Zip'
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ],
                                'actions': [
                                    {
                                        'type': 'Action.ShowCard',
                                        'title': '3. Phone/Email',
                                        'card': {
                                            'type': 'AdaptiveCard',
                                            '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
                                            'body': [
                                                {
                                                    'type': 'Input.Text',
                                                    'label': 'Cell Number',
                                                    'id': 'CellPhone'
                                                },
                                                {
                                                    'type': 'Input.Text',
                                                    'label': 'Home Number',
                                                    'id': 'HomePhone'
                                                },
                                                {
                                                    'type': 'Input.Text',
                                                    'label': 'Email Address',
                                                    'id': 'Email'
                                                }
                                            ],
                                            'actions': [
                                                {
                                                    'type': 'Action.Submit',
                                                    'title': 'Submit'
                                                }
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        ]
    }
});

// https://adaptivecards.io/samples/ExpenseReport.html
const expenseReport = new AdaptiveCardModel({
    id: 'expense-report',
    position: { x: 0, y: 0 },
    size: { width: 500, height: 0 },
    template: {
        'type': 'AdaptiveCard',
        'body': [
            {
                'type': 'Container',
                'style': 'emphasis',
                'items': [
                    {
                        'type': 'ColumnSet',
                        'columns': [
                            {
                                'type': 'Column',
                                'items': [
                                    {
                                        'type': 'TextBlock',
                                        'size': 'large',
                                        'weight': 'bolder',
                                        'text': '**EXPENSE APPROVAL**',
                                        'wrap': true,
                                        'style': 'heading'
                                    }
                                ],
                                'width': 'stretch'
                            },
                            {
                                'type': 'Column',
                                'items': [
                                    {
                                        'type': 'Image',
                                        'url': 'https://adaptivecards.io/content/pending.png',
                                        'height': '30px',
                                        'altText': 'Pending'
                                    }
                                ],
                                'width': 'auto'
                            }
                        ]
                    }
                ],
                'bleed': true
            },
            {
                'type': 'Container',
                'items': [
                    {
                        'type': 'ColumnSet',
                        'columns': [
                            {
                                'type': 'Column',
                                'items': [
                                    {
                                        'type': 'TextBlock',
                                        'size': 'extraLarge',
                                        'text': 'Trip to UAE',
                                        'wrap': true,
                                        'style': 'heading'
                                    }
                                ],
                                'width': 'stretch'
                            },
                            {
                                'type': 'Column',
                                'items': [
                                    {
                                        'type': 'ActionSet',
                                        'actions': [
                                            {
                                                'type': 'Action.OpenUrl',
                                                'title': 'EXPORT AS PDF',
                                                'url': 'https://adaptivecards.io'
                                            }
                                        ]
                                    }
                                ],
                                'width': 'auto'
                            }
                        ]
                    },
                    {
                        'type': 'TextBlock',
                        'spacing': 'small',
                        'size': 'small',
                        'weight': 'bolder',
                        'text': '[ER-13052](https://adaptivecards.io)',
                        'wrap': true
                    },
                    {
                        'type': 'FactSet',
                        'spacing': 'large',
                        'facts': [
                            {
                                'title': 'Submitted By',
                                'value': '**Matt Hidinger**  matt@contoso.com'
                            },
                            {
                                'title': 'Duration',
                                'value': '2019/06/19 - 2019/06/25'
                            },
                            {
                                'title': 'Submitted On',
                                'value': '2019/04/14'
                            },
                            {
                                'title': 'Reimbursable Amount',
                                'value': '$ 404.30'
                            },
                            {
                                'title': 'Awaiting approval from',
                                'value': '**Thomas**  thomas@contoso.com'
                            },
                            {
                                'title': 'Submitted to',
                                'value': '**David**  david@contoso.com'
                            }
                        ]
                    }
                ]
            },
            {
                'type': 'Container',
                'spacing': 'large',
                'style': 'emphasis',
                'items': [
                    {
                        'type': 'ColumnSet',
                        'columns': [
                            {
                                'type': 'Column',
                                'items': [
                                    {
                                        'type': 'TextBlock',
                                        'weight': 'bolder',
                                        'text': 'DATE',
                                        'wrap': true
                                    }
                                ],
                                'width': 'auto'
                            },
                            {
                                'type': 'Column',
                                'spacing': 'large',
                                'items': [
                                    {
                                        'type': 'TextBlock',
                                        'weight': 'bolder',
                                        'text': 'CATEGORY',
                                        'wrap': true
                                    }
                                ],
                                'width': 'stretch'
                            },
                            {
                                'type': 'Column',
                                'items': [
                                    {
                                        'type': 'TextBlock',
                                        'weight': 'bolder',
                                        'text': 'AMOUNT',
                                        'wrap': true
                                    }
                                ],
                                'width': 'auto'
                            }
                        ]
                    }
                ],
                'bleed': true
            },
            {
                'type': 'ColumnSet',
                'columns': [
                    {
                        'type': 'Column',
                        'items': [
                            {
                                'type': 'TextBlock',
                                'text': '06/19',
                                'wrap': true
                            }
                        ],
                        'width': 'auto'
                    },
                    {
                        'type': 'Column',
                        'spacing': 'medium',
                        'items': [
                            {
                                'type': 'TextBlock',
                                'text': 'Air Travel Expense',
                                'wrap': true
                            }
                        ],
                        'width': 'stretch'
                    },
                    {
                        'type': 'Column',
                        'items': [
                            {
                                'type': 'TextBlock',
                                'text': '$ 300',
                                'wrap': true
                            }
                        ],
                        'width': 'auto'
                    },
                    {
                        'type': 'Column',
                        'spacing': 'small',
                        'verticalContentAlignment': 'center',
                        'items': [
                            {
                                'type': 'Image',
                                'id': 'chevronDown1',
                                'url': 'https://adaptivecards.io/content/down.png',
                                'width': '20px',
                                'altText': 'Air Travel Expense $300 collapsed'
                            },
                            {
                                'type': 'Image',
                                'id': 'chevronUp1',
                                'isVisible': false,
                                'url': 'https://adaptivecards.io/content/up.png',
                                'width': '20px',
                                'altText': 'Air Travel Expense $300 expanded'
                            }
                        ],
                        'selectAction': {
                            'type': 'Action.ToggleVisibility',
                            'targetElements': ['cardContent1', 'chevronUp1', 'chevronDown1']
                        },
                        'width': 'auto'
                    }
                ]
            },
            {
                'type': 'Container',
                'id': 'cardContent1',
                'isVisible': false,
                'items': [
                    {
                        'type': 'Container',
                        'items': [
                            {
                                'type': 'TextBlock',
                                'text': '* Leg 1 on Tue, Jun 19th, 2019 at 6:00 AM.',
                                'isSubtle': true,
                                'wrap': true
                            },
                            {
                                'type': 'TextBlock',
                                'text': '* Leg 2 on Tue,Jun 19th, 2019 at 7:15 PM.',
                                'isSubtle': true,
                                'wrap': true
                            },
                            {
                                'type': 'Container',
                                'items': [
                                    {
                                        'type': 'Input.Text',
                                        'id': 'comment1',
                                        'label': 'Add your comment here'
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        'type': 'Container',
                        'items': [
                            {
                                'type': 'ColumnSet',
                                'columns': [
                                    {
                                        'type': 'Column',
                                        'items': [
                                            {
                                                'type': 'ActionSet',
                                                'actions': [
                                                    {
                                                        'type': 'Action.Submit',
                                                        'title': 'Send',
                                                        'data': {
                                                            'id': '_qkQW8dJlUeLVi7ZMEzYVw',
                                                            'action': 'comment',
                                                            'lineItem': 1
                                                        }
                                                    }
                                                ]
                                            }
                                        ],
                                        'width': 'auto'
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                'type': 'ColumnSet',
                'columns': [
                    {
                        'type': 'Column',
                        'items': [
                            {
                                'type': 'TextBlock',
                                'horizontalAlignment': 'center',
                                'text': '06/19',
                                'wrap': true
                            }
                        ],
                        'width': 'auto'
                    },
                    {
                        'type': 'Column',
                        'spacing': 'medium',
                        'items': [
                            {
                                'type': 'TextBlock',
                                'text': 'Auto Mobile Expense',
                                'wrap': true
                            }
                        ],
                        'width': 'stretch'
                    },
                    {
                        'type': 'Column',
                        'items': [
                            {
                                'type': 'TextBlock',
                                'text': '$ 100',
                                'wrap': true
                            }
                        ],
                        'width': 'auto'
                    },
                    {
                        'type': 'Column',
                        'spacing': 'small',
                        'verticalContentAlignment': 'center',
                        'items': [
                            {
                                'type': 'Image',
                                'id': 'chevronDown2',
                                'url': 'https://adaptivecards.io/content/down.png',
                                'width': '20px',
                                'altText': 'Auto Mobile Expense $100 collapsed'
                            },
                            {
                                'type': 'Image',
                                'id': 'chevronUp2',
                                'isVisible': false,
                                'url': 'https://adaptivecards.io/content/up.png',
                                'width': '20px',
                                'altText': 'Auto Mobile Expense $100 expanded'
                            }
                        ],
                        'selectAction': {
                            'type': 'Action.ToggleVisibility',
                            'targetElements': ['cardContent2', 'chevronUp2', 'chevronDown2']
                        },
                        'width': 'auto'
                    }
                ]
            },
            {
                'type': 'Container',
                'id': 'cardContent2',
                'isVisible': false,
                'items': [
                    {
                        'type': 'Container',
                        'items': [
                            {
                                'type': 'TextBlock',
                                'text': '* Contoso Car Rentrals, Tues 6/19 at 7:00 AM',
                                'isSubtle': true,
                                'wrap': true
                            },
                            {
                                'type': 'Container',
                                'items': [
                                    {
                                        'type': 'Input.Text',
                                        'id': 'comment2',
                                        'label': 'Add your comment here'
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        'type': 'Container',
                        'items': [
                            {
                                'type': 'ColumnSet',
                                'columns': [
                                    {
                                        'type': 'Column',
                                        'items': [
                                            {
                                                'type': 'ActionSet',
                                                'actions': [
                                                    {
                                                        'type': 'Action.Submit',
                                                        'title': 'Send',
                                                        'data': {
                                                            'id': '_qkQW8dJlUeLVi7ZMEzYVw',
                                                            'action': 'comment',
                                                            'lineItem': 2
                                                        }
                                                    }
                                                ]
                                            }
                                        ],
                                        'width': 'auto'
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                'type': 'ColumnSet',
                'columns': [
                    {
                        'type': 'Column',
                        'items': [
                            {
                                'type': 'TextBlock',
                                'horizontalAlignment': 'center',
                                'text': '06/25',
                                'wrap': true
                            }
                        ],
                        'width': 'auto'
                    },
                    {
                        'type': 'Column',
                        'spacing': 'medium',
                        'items': [
                            {
                                'type': 'TextBlock',
                                'text': 'Excess Baggage Cost',
                                'wrap': true
                            }
                        ],
                        'width': 'stretch'
                    },
                    {
                        'type': 'Column',
                        'items': [
                            {
                                'type': 'TextBlock',
                                'text': '$ 4.30',
                                'wrap': true
                            }
                        ],
                        'width': 'auto'
                    },
                    {
                        'type': 'Column',
                        'spacing': 'small',
                        'verticalContentAlignment': 'center',
                        'items': [
                            {
                                'type': 'Image',
                                'id': 'chevronDown3',
                                'url': 'https://adaptivecards.io/content/down.png',
                                'width': '20px',
                                'altText': 'Excess Baggage Cost $50.38 collapsed'
                            },
                            {
                                'type': 'Image',
                                'id': 'chevronUp3',
                                'isVisible': false,
                                'url': 'https://adaptivecards.io/content/up.png',
                                'width': '20px',
                                'altText': 'Excess Baggage Cost $50.38 expanded'
                            }
                        ],
                        'selectAction': {
                            'type': 'Action.ToggleVisibility',
                            'targetElements': ['cardContent3', 'chevronUp3', 'chevronDown3']
                        },
                        'width': 'auto'
                    }
                ]
            },
            {
                'type': 'Container',
                'id': 'cardContent3',
                'isVisible': false,
                'items': [
                    {
                        'type': 'Container',
                        'items': [
                            {
                                'type': 'Input.Text',
                                'id': 'comment3',
                                'label': 'Add your comment here'
                            }
                        ]
                    },
                    {
                        'type': 'Container',
                        'items': [
                            {
                                'type': 'ColumnSet',
                                'columns': [
                                    {
                                        'type': 'Column',
                                        'items': [
                                            {
                                                'type': 'ActionSet',
                                                'actions': [
                                                    {
                                                        'type': 'Action.Submit',
                                                        'title': 'Send',
                                                        'data': {
                                                            'id': '_qkQW8dJlUeLVi7ZMEzYVw',
                                                            'action': 'comment',
                                                            'lineItem': 3
                                                        }
                                                    }
                                                ]
                                            }
                                        ],
                                        'width': 'auto'
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                'type': 'Table',
                'spacing': 'large',
                'separator': true,
                'firstRowAsHeaders': false,
                'showGridLines': false,
                'columns': [
                    {
                        'width': 3
                    },
                    {
                        'width': 1
                    }
                ],
                'rows': [
                    {
                        'type': 'TableRow',
                        'cells': [
                            {
                                'type': 'TableCell',
                                'items': [
                                    {
                                        'type': 'TextBlock',
                                        'text': 'Total Expense Amount',
                                        'horizontalAlignment': 'right',
                                        'wrap': true
                                    }
                                ]
                            },
                            {
                                'type': 'TableCell',
                                'items': [
                                    {
                                        'type': 'TextBlock',
                                        'text': '404.30',
                                        'horizontalAlignment': 'right',
                                        'wrap': true
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        'type': 'TableRow',
                        'cells': [
                            {
                                'type': 'TableCell',
                                'items': [
                                    {
                                        'type': 'TextBlock',
                                        'text': 'Non-reimbursable Amount',
                                        'horizontalAlignment': 'right',
                                        'wrap': true
                                    }
                                ]
                            },
                            {
                                'type': 'TableCell',
                                'items': [
                                    {
                                        'type': 'TextBlock',
                                        'text': '(-) 0.00',
                                        'horizontalAlignment': 'right',
                                        'wrap': true
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        'type': 'TableRow',
                        'cells': [
                            {
                                'type': 'TableCell',
                                'items': [
                                    {
                                        'type': 'TextBlock',
                                        'text': 'Advance Amount',
                                        'horizontalAlignment': 'right',
                                        'wrap': true
                                    }
                                ]
                            },
                            {
                                'type': 'TableCell',
                                'items': [
                                    {
                                        'type': 'TextBlock',
                                        'text': '(-) 0.00',
                                        'horizontalAlignment': 'right',
                                        'wrap': true
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                'type': 'Container',
                'style': 'emphasis',
                'items': [
                    {
                        'type': 'ColumnSet',
                        'columns': [
                            {
                                'type': 'Column',
                                'items': [
                                    {
                                        'type': 'TextBlock',
                                        'horizontalAlignment': 'right',
                                        'text': 'Amount to be Reimbursed',
                                        'wrap': true
                                    }
                                ],
                                'width': 'stretch'
                            },
                            {
                                'type': 'Column',
                                'items': [
                                    {
                                        'type': 'TextBlock',
                                        'weight': 'bolder',
                                        'text': '$ 404.30',
                                        'wrap': true
                                    }
                                ],
                                'width': 'auto'
                            },
                            {
                                'type': 'Column',
                                'width': 'auto'
                            }
                        ]
                    }
                ],
                'bleed': true
            },
            {
                'type': 'ColumnSet',
                'columns': [
                    {
                        'type': 'Column',
                        'selectAction': {
                            'type': 'Action.ToggleVisibility',
                            'targetElements': ['cardContent4', 'showHistory', 'hideHistory']
                        },
                        'verticalContentAlignment': 'center',
                        'items': [
                            {
                                'type': 'TextBlock',
                                'id': 'showHistory',
                                'horizontalAlignment': 'right',
                                'color': 'accent',
                                'text': 'Show history',
                                'wrap': true
                            },
                            {
                                'type': 'TextBlock',
                                'id': 'hideHistory',
                                'isVisible': false,
                                'horizontalAlignment': 'right',
                                'color': 'accent',
                                'text': 'Hide history',
                                'wrap': true
                            }
                        ],
                        'width': 1
                    }
                ]
            },
            {
                'type': 'Container',
                'id': 'cardContent4',
                'isVisible': false,
                'items': [
                    {
                        'type': 'Container',
                        'items': [
                            {
                                'type': 'TextBlock',
                                'text': '* Expense submitted by **Matt** on Wed, Apr 14th, 2019',
                                'isSubtle': true,
                                'wrap': true
                            },
                            {
                                'type': 'TextBlock',
                                'text': '* Expense approved by **Thomas** on Thu, Apr 15th, 2019',
                                'isSubtle': true,
                                'wrap': true
                            }
                        ]
                    }
                ]
            },
            {
                'type': 'Container',
                'items': [
                    {
                        'type': 'ActionSet',
                        'actions': [
                            {
                                'type': 'Action.Submit',
                                'title': 'Approve',
                                'style': 'positive',
                                'data': {
                                    'id': '_qkQW8dJlUeLVi7ZMEzYVw',
                                    'action': 'approve'
                                }
                            },
                            {
                                'type': 'Action.ShowCard',
                                'title': 'Reject',
                                'style': 'destructive',
                                'card': {
                                    'type': 'AdaptiveCard',
                                    'body': [
                                        {
                                            'type': 'Input.Text',
                                            'id': 'RejectCommentID',
                                            'label': 'Please specify an appropriate reason for rejection',
                                            'isRequired': true,
                                            'isMultiline': true,
                                            'errorMessage': 'A reason for rejection is necessary'
                                        }
                                    ],
                                    'actions': [
                                        {
                                            'type': 'Action.Submit',
                                            'title': 'Send',
                                            'data': {
                                                'id': '_qkQW8dJlUeLVi7ZMEzYVw',
                                                'action': 'reject'
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                ]
            }
        ],
        '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
        'version': '1.5',
        'fallbackText': 'This card requires Adaptive Cards v1.5 support to be rendered properly.'
    }
});

graph.addCells([activity, agenda, weather, wizard, expenseReport]);

// Logging

paper.on('element:submit', (elementView, data) => {
    log(elementView.model, 'submit-action', data);
});

paper.on('element:open-url', (elementView, url) => {
    log(elementView.model, 'open-url-action', { url });
});

const logger = new AdaptiveCardModel({
    id: 'logger',
    position: { x: 550, y: 550 },
    size: { width: 300, height: 300 },
    border: '2px solid #D22D1F',
    template: {
        '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
        'type': 'AdaptiveCard',
        'version': '1.5',
        'fallbackText': 'This card requires Media to be viewed. Ask your platform to update to Adaptive Cards v1.6 for this and more!',
        'body': [
            {
                'type': 'TextBlock',
                'text': 'Adaptive Card Events',
                'wrap': true,
                'style': 'heading'
            },
            {
                'type': 'Container',
                'items': [
                    {
                        'type': 'TextBlock',
                        'text': 'Submit a form and inspect the data here.'
                    }
                ]
            }
        ]
    }
});

const link1 = new shapes.standard.Link({ z: 2 });
link1.source(activity);
link1.target(logger);
const link2 = new shapes.standard.Link({ z: 2 });
link2.source(expenseReport);
link2.target(logger);
const link3 = new shapes.standard.Link({ z: 2 });
link3.source(wizard);
link3.target(logger);

graph.addCells([logger, link1, link2, link3]);

function log(element, type, data) {

    const entries = Object.entries(data);
    let factSet = null;
    if (entries.length > 0) {
        factSet = {
            'type': 'FactSet',
            'facts': Object.entries(data).map(([key, value]) => {
                return {
                    'title': `${key}`,
                    'value': `${value}`
                };
            })
        };
    } else {
        factSet = {
            'type': 'TextBlock',
            'text': 'No data provided'
        };
    }

    logger.set('template', {
        '$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
        'type': 'AdaptiveCard',
        'version': '1.0',
        'body': [
            {
                'type': 'TextBlock',
                'text': 'Adaptive Cards Events',
                'wrap': true,
                'style': 'heading'
            },
            {
                'type': 'Container',
                'style': 'emphasis',
                'items': [

                    {
                        'type': 'Container',
                        'style': 'good',
                        'items': [
                            {
                                'type': 'FactSet',
                                'facts': [
                                    {
                                        'title': 'Sender:',
                                        'value': element.id
                                    },
                                    {
                                        'title': 'Type:',
                                        'value': type
                                    }
                                ]
                            },
                        ]
                    },
                    factSet
                ]
            }
        ]
    });
}

// Setup scrolling

paper.el.style.cursor = 'grab';

paper.on('blank:pointerdown', (evt) => {
    evt.data = {
        scrollX: window.scrollX, clientX: evt.clientX,
        scrollY: window.scrollY, clientY: evt.clientY
    };
    paper.el.style.cursor = 'grabbing';
});

paper.on('blank:pointermove', (evt) => {
    window.scroll(evt.data.scrollX + (evt.data.clientX - evt.clientX), evt.data.scrollY + (evt.data.clientY - evt.clientY));
});

paper.on('blank:pointerup', () => {
    paper.el.style.cursor = 'grab';
});
