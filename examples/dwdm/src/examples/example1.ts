import { IData } from '../data';
import {
    Multiplexer, Demultiplexer, ROADMultiplexer,
    RightAmplifier, LeftAmplifier,
    FiberProtectionUnit, OpticalPowerMonitoring,
    NodeLink, FiberLink, ExternalLink,
} from '../shapes';

const data: IData = {
    nodes: [
        {
            name: 'Node-1',
            ip: '192.168.xxx.xxx',
            x: 100,
            y: 100,
            image: 'assets/node1.svg',
            cards: [
                {
                    ctor: Multiplexer,
                    id: 'MUX-1',
                    x: 60,
                    y: 120,
                    ports: [
                        {
                            group: 'left',
                            id: 'Port-1-2'
                        },
                        {
                            group: 'right',
                            id: 'Port-1-1'
                        },
                        {
                            group: 'left',
                            id: 'Port-1-3'
                        },
                        {
                            group: 'left',
                            id: 'Port-1-4'
                        },
                        {
                            group: 'left',
                            id: 'Port-1-5'
                        },
                    ],
                    links: {
                        'Port-1-1': [{
                            ctor: NodeLink,
                            id: 'ROADM-2',
                            port: 'Port-2-1'
                        }]
                    }
                },
                {
                    ctor: ROADMultiplexer,
                    id: 'ROADM-2',
                    x: 210,
                    y: 120,
                    ports: [
                        {
                            group: 'left',
                            id: 'Port-2-1'
                        },
                        {
                            group: 'right',
                            id: 'Port-2-2'
                        }
                    ],
                    links: {
                        'Port-2-2': [{
                            ctor: NodeLink,
                            id: 'FPU-3',
                            port: 'Port-3-1'
                        }],
                        'Port-2-1': [{
                            ctor: NodeLink,
                            id: 'MUX-1',
                            port: 'Port-1-1'
                        }]
                    },
                },
                {
                    ctor: FiberProtectionUnit,
                    id: 'FPU-3',
                    x: 360,
                    y: 180,
                    ports: [
                        {
                            group: 'left',
                            id: 'Port-3-1'
                        },
                        {
                            group: 'top',
                            id: 'Port-3-2'
                        },
                        {
                            group: 'bottom',
                            id: 'Port-3-3'
                        }
                    ],
                    links: {
                        'Port-3-2': [{
                            ctor: NodeLink,
                            id: 'AMP-4',
                            port: 'Port-4-1'
                        }],
                        'Port-3-3': [{
                            ctor: NodeLink,
                            id: 'AMP-8',
                            port: 'Port-8-1'
                        }],
                        'Port-3-1': [{
                            ctor: NodeLink,
                            id: 'ROADM-2',
                            port: 'Port-2-2'
                        }]
                    },
                },
                {
                    ctor: RightAmplifier,
                    id: 'AMP-4',
                    x: 500,
                    y: 70,
                    ports: [
                        {
                            group: 'left',
                            id: 'Port-4-1'
                        },
                        {
                            group: 'right',
                            id: 'Port-4-2'
                        }
                    ],
                    links: {
                        'Port-4-2': [{
                            ctor: FiberLink,
                            id: 'AMP-6',
                            port: 'Port-6-1'
                        }]
                    },
                },
                {
                    ctor: LeftAmplifier,
                    id: 'AMP-5',
                    x: 500,
                    y: 100,
                    ports: [
                        {
                            group: 'left',
                            id: 'Port-5-1'
                        },
                        {
                            group: 'right',
                            id: 'Port-5-2'
                        }
                    ],
                    links: {
                        'Port-5-1': [{
                            ctor: NodeLink,
                            id: 'FPU-3',
                            port: 'Port-3-2'
                        }]
                    }
                },
                {
                    ctor: RightAmplifier,
                    id: 'AMP-8',
                    x: 500,
                    y: 300,
                    ports: [
                        {
                            group: 'left',
                            id: 'Port-8-1'
                        },
                        {
                            group: 'right',
                            id: 'Port-8-2'
                        }
                    ],
                    links: {
                        'Port-8-2': [{
                            ctor: FiberLink,
                            id: 'AMP-10',
                            port: 'Port-10-1'
                        }]
                    }
                },
                {
                    ctor: LeftAmplifier,
                    id: 'AMP-9',
                    x: 500,
                    y: 330,
                    ports: [
                        {
                            group: 'left',
                            id: 'Port-9-1'
                        },
                        {
                            group: 'right',
                            id: 'Port-9-2'
                        }
                    ],
                    links: {
                        'Port-9-1': [{
                            ctor: NodeLink,
                            id: 'FPU-3',
                            port: 'Port-3-3'
                        }]
                    }
                }
            ]
        },
        {
            name: 'Node-2',
            ip: '192.168.xxx.xxx',
            x: 800,
            y: 100,
            image: 'assets/node2.svg',
            cards: [
                {
                    ctor: RightAmplifier,
                    id: 'AMP-6',
                    x: 80,
                    y: 70,
                    ports: [
                        {
                            group: 'left',
                            id: 'Port-6-1'
                        },
                        {
                            group: 'right',
                            id: 'Port-6-2'
                        }
                    ],
                    links: {
                        'Port-6-2': [{
                            ctor: NodeLink,
                            id: 'FPU-12',
                            port: 'Port-12-2'
                        }]
                    }

                },
                {
                    ctor: LeftAmplifier,
                    id: 'AMP-7',
                    x: 80,
                    y: 100,
                    ports: [
                        {
                            group: 'left',
                            id: 'Port-7-1'
                        },
                        {
                            group: 'right',
                            id: 'Port-7-2'
                        }
                    ],
                    links: {
                        'Port-7-1': [{
                            ctor: FiberLink,
                            id: 'AMP-5',
                            port: 'Port-5-2'
                        }]
                    }
                },
                {
                    ctor: RightAmplifier,
                    id: 'AMP-10',
                    x: 80,
                    y: 300,
                    ports: [
                        {
                            group: 'left',
                            id: 'Port-10-1'
                        },
                        {
                            group: 'right',
                            id: 'Port-10-2'
                        }
                    ],
                    links: {
                        'Port-10-2': [{
                            ctor: NodeLink,
                            id: 'FPU-12',
                            port: 'Port-12-3'
                        }]
                    }
                },
                {
                    ctor: LeftAmplifier,
                    id: 'APM-11',
                    x: 80,
                    y: 330,
                    ports: [
                        {
                            group: 'left',
                            id: 'Port-11-1'
                        },
                        {
                            group: 'right',
                            id: 'Port-11-2'
                        }
                    ],
                    links: {
                        'Port-11-1': [{
                            ctor: FiberLink,
                            id: 'AMP-9',
                            port: 'Port-9-2'
                        }]
                    }
                },
                {
                    ctor: FiberProtectionUnit,
                    id: 'FPU-12',
                    x: 180,
                    y: 180,
                    ports: [
                        {
                            group: 'right',
                            id: 'Port-12-1'
                        },
                        {
                            group: 'top',
                            id: 'Port-12-2'
                        },
                        {
                            group: 'bottom',
                            id: 'Port-12-3'
                        }
                    ],
                    links: {
                        'Port-12-2': [{
                            ctor: NodeLink,
                            id: 'AMP-7',
                            port: 'Port-7-2'
                        }],
                        'Port-12-3': [{
                            ctor: NodeLink,
                            id: 'APM-11',
                            port: 'Port-11-2'
                        }],
                        'Port-12-1': [{
                            ctor: NodeLink,
                            id: 'ROADM-13',
                            port: 'Port-13-1'
                        }]
                    }
                },
                {
                    ctor: ROADMultiplexer,
                    id: 'ROADM-13',
                    x: 340,
                    y: 120,
                    ports: [
                        {
                            group: 'left',
                            id: 'Port-13-1'
                        },
                        {
                            group: 'right',
                            id: 'Port-13-2'
                        }
                    ],
                    links: {
                        'Port-13-2': [{
                            ctor: NodeLink,
                            id: 'ROADM-14',
                            port: 'Port-14-1'
                        }],
                        'Port-13-1': [{
                            ctor: NodeLink,
                            id: 'FPU-12',
                            port: 'Port-12-1'
                        }]
                    }
                },
                {
                    ctor: ROADMultiplexer,
                    id: 'ROADM-14',
                    x: 500,
                    y: 120,
                    ports: [
                        {
                            group: 'left',
                            id: 'Port-14-1'
                        },
                        {
                            group: 'right',
                            id: 'Port-14-2'
                        }
                    ],
                    links: {
                        'Port-14-2': [{
                            ctor: NodeLink,
                            id: 'AMP-15',
                            port: 'Port-15-1'
                        }],
                        'Port-14-1': [{
                            ctor: NodeLink,
                            id: 'ROADM-13',
                            port: 'Port-13-2'
                        }]
                    }
                },
                {
                    ctor: RightAmplifier,
                    id: 'AMP-15',
                    x: 700,
                    y: 170,
                    ports: [
                        {
                            group: 'left',
                            id: 'Port-15-1'
                        },
                        {
                            group: 'right',
                            id: 'Port-15-2'
                        }
                    ],
                    links: {
                        'Port-15-2': [{
                            ctor: FiberLink,
                            id: 'AMP-17',
                            port: 'Port-17-1'
                        }]
                    }
                },
                {
                    ctor: LeftAmplifier,
                    id: 'AMP-16',
                    x: 700,
                    y: 230,
                    ports: [
                        {
                            group: 'left',
                            id: 'Port-16-1'
                        },
                        {
                            group: 'right',
                            id: 'Port-16-2'
                        }
                    ],
                    links: {
                        'Port-16-1': [{
                            ctor: NodeLink,
                            id: 'ROADM-14',
                            port: 'Port-14-2'
                        }]
                    }
                }
            ]
        },
        {
            name: 'Node-3',
            ip: '192.168.xxx.xxx',
            x: 1680,
            y: 100,
            image: 'assets/node3.svg',
            cards: [
                {
                    ctor: RightAmplifier,
                    id: 'AMP-17',
                    x: 60,
                    y: 170,
                    ports: [
                        {
                            group: 'left',
                            id: 'Port-17-1'
                        },
                        {
                            group: 'right',
                            id: 'Port-17-2'
                        },
                        {
                            group: 'top',
                            id: 'Port-17-3'
                        }
                    ],
                    links: {
                        'Port-17-2': [{
                            ctor: NodeLink,
                            id: 'ROADM-19',
                            port: 'Port-19-1'
                        }]
                    }
                },
                {
                    ctor: LeftAmplifier,
                    id: 'AMP-18',
                    x: 60,
                    y: 230,
                    ports: [
                        {
                            group: 'left',
                            id: 'Port-18-1'
                        },
                        {
                            group: 'right',
                            id: 'Port-18-2'
                        },
                        {
                            group: 'bottom',
                            id: 'Port-18-3'
                        }
                    ],
                    links: {
                        'Port-18-1': [{
                            ctor: FiberLink,
                            id: 'AMP-16',
                            port: 'Port-16-2'
                        }]
                    }
                },
                {
                    ctor: OpticalPowerMonitoring,
                    id: 'OPM-21',
                    x: 50,
                    y: 60,
                    ports: [
                        {
                            group: 'bottom',
                            id: 'Port-21-1'
                        }
                    ],
                    links: {
                        'Port-21-1': [{
                            ctor: NodeLink,
                            id: 'AMP-17',
                            port: 'Port-17-3'
                        }]
                    }
                },
                {
                    ctor: OpticalPowerMonitoring,
                    id: 'OPM-22',
                    x: 50,
                    y: 320,
                    ports: [
                        {
                            group: 'top',
                            id: 'Port-22-1'
                        }
                    ],
                    links: {
                        'Port-22-1': [{
                            ctor: NodeLink,
                            id: 'AMP-18',
                            port: 'Port-18-3'
                        }]
                    }
                },
                {
                    ctor: ROADMultiplexer,
                    id: 'ROADM-19',
                    x: 220,
                    y: 120,
                    ports: [
                        {
                            group: 'left',
                            id: 'Port-19-1'
                        },
                        {
                            group: 'right',
                            id: 'Port-19-2'
                        }
                    ],
                    links: {
                        'Port-19-1': [{
                            ctor: NodeLink,
                            id: 'AMP-18',
                            port: 'Port-18-2'
                        }],
                        'Port-19-2': [{
                            ctor: NodeLink,
                            id: 'DMUX-20',
                            port: 'Port-20-1'
                        }]
                    }
                },
                {
                    ctor: Demultiplexer,
                    id: 'DMUX-20',
                    x: 380,
                    y: 120,
                    ports: [
                        {
                            group: 'left',
                            id: 'Port-20-1'
                        },
                        {
                            group: 'right',
                            id: 'Port-20-2'
                        },
                        {
                            group: 'right',
                            id: 'Port-20-3'
                        },
                        {
                            group: 'right',
                            id: 'Port-20-4'
                        },
                        {
                            group: 'right',
                            id: 'Port-20-5'
                        }
                    ],
                    links: {
                        'Port-20-1': [{
                            ctor: NodeLink,
                            id: 'ROADM-19',
                            port: 'Port-19-2'
                        }],
                    }
                }
            ]
        }
    ],
    links: [{
        ctor: ExternalLink,
        id: 'MUX-1',
        port: 'Port-1-2',
        description: '1470nm'
    }, {
        ctor: ExternalLink,
        id: 'MUX-1',
        port: 'Port-1-3',
        description: '1490nm'
    }, {
        ctor: ExternalLink,
        id: 'MUX-1',
        port: 'Port-1-4',
        description: '1510nm'
    }, {
        ctor: ExternalLink,
        id: 'MUX-1',
        port: 'Port-1-5',
        description: '1530nm'
    }, {
        ctor: ExternalLink,
        id: 'DMUX-20',
        port: 'Port-20-2',
        description: '1470nm'
    }, {
        ctor: ExternalLink,
        id: 'DMUX-20',
        port: 'Port-20-3',
        description: '1490nm'
    }, {
        ctor: ExternalLink,
        id: 'DMUX-20',
        port: 'Port-20-4',
        description: '1510nm'
    }, {
        ctor: ExternalLink,
        id: 'DMUX-20',
        port: 'Port-20-5',
        description: '1530nm'
    }],
}

export default data;

