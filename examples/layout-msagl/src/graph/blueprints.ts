export type NodeSpec = {
    id: string;
    label: string;
    kind?: 'element' | 'parent';
    parentId?: string;
    variant?: 'rounded' | 'pill' | 'circle';
    width?: number;
    height?: number;
    fontSize?: number;
    fontWeight?: string;
    size?: { width: number; height: number };
};

export type LinkSpec = {
    from: string;
    to: string;
    label?: string;
    options?: Record<string, any>;
};

export type GraphBlueprint = {
    nodes: NodeSpec[];
    links: LinkSpec[];
};

export const treeBlueprint: GraphBlueprint = {
    nodes: [
        { id: 'vision', label: 'Product Vision', variant: 'pill', width: 210, height: 60, fontSize: 16, fontWeight: '600' },
        { id: 'discovery', label: 'Discovery' },
        { id: 'design', label: 'Design' },
        { id: 'delivery', label: 'Delivery' },
        { id: 'research', label: 'Research Insights' },
        { id: 'market', label: 'Market Signals' },
        { id: 'journey', label: 'Journey Mapping' },
        { id: 'prototype', label: 'Rapid Prototype' },
        { id: 'qa', label: 'Quality Readiness' },
        { id: 'launch', label: 'Launch Plan' },
        { id: 'adoption', label: 'Adoption' },
        { id: 'feedback', label: 'Feedback Loop' },
        { id: 'nurture', label: 'Customer Nurture' }
    ],
    links: [
        { from: 'vision', to: 'discovery', label: 'Hypotheses' },
        { from: 'vision', to: 'design', label: 'Design Goals' },
        { from: 'vision', to: 'delivery', label: 'Roadmap' },
        { from: 'discovery', to: 'research', label: 'User Research' },
        { from: 'discovery', to: 'market', label: 'Market Analysis' },
        { from: 'design', to: 'journey', label: 'Journey Map' },
        { from: 'design', to: 'prototype', label: 'Prototype' },
        { from: 'delivery', to: 'qa', label: 'Quality Gate' },
        { from: 'delivery', to: 'launch', label: 'Go-to-Market' },
        { from: 'prototype', to: 'adoption', label: 'Adoption' },
        { from: 'launch', to: 'feedback', label: 'Feedback Loop' },
        { from: 'launch', to: 'nurture', label: 'Retention' }
    ]
};

export const dagBlueprint: GraphBlueprint = {
    nodes: [
        { id: 'signals', label: 'Signals', variant: 'pill', width: 160 },
        { id: 'ingestion', label: 'Ingestion', variant: 'pill', width: 150 },
        { id: 'staging', label: 'Staging' },
        { id: 'processing', label: 'Processing' },
        { id: 'feature-store', label: 'Feature Store' },
        { id: 'modeling', label: 'Modeling' },
        { id: 'registry', label: 'Registry' },
        { id: 'serving', label: 'Serving' },
        { id: 'observability', label: 'Observability' },
        { id: 'feedback', label: 'Feedback' }
    ],
    links: [
        { from: 'signals', to: 'ingestion' },
        { from: 'signals', to: 'staging' },
        { from: 'ingestion', to: 'processing' },
        { from: 'ingestion', to: 'feature-store' },
        { from: 'staging', to: 'processing' },
        { from: 'processing', to: 'modeling' },
        { from: 'processing', to: 'registry' },
        { from: 'feature-store', to: 'registry' },
        { from: 'modeling', to: 'serving' },
        { from: 'registry', to: 'serving' },
        { from: 'registry', to: 'observability' },
        { from: 'serving', to: 'feedback', options: { label: 'Serve' } },
        { from: 'observability', to: 'feedback', options: { label: 'Insights' } }
    ]
};

export const networkBlueprint: GraphBlueprint = {
    nodes: [
        { id: 'north', label: 'North Squad', variant: 'pill', width: 160, fontWeight: '500' },
        { id: 'west', label: 'West Squad', width: 160, fontWeight: '500' },
        { id: 'east', label: 'East Squad', width: 160, fontWeight: '500' },
        { id: 'south', label: 'South Squad', width: 160, fontWeight: '500' },
        { id: 'design-circle', label: 'Design Circle', variant: 'pill', width: 160, fontWeight: '500' },
        { id: 'data-guild', label: 'Data Guild', width: 160, fontWeight: '500' },
        { id: 'ops-crew', label: 'Ops Crew', width: 160, fontWeight: '500' },
        { id: 'growth-pod', label: 'Growth Pod', variant: 'pill', width: 160, fontWeight: '500' },
        { id: 'security-unit', label: 'Security Unit', width: 160, fontWeight: '500' },
        { id: 'marketing', label: 'Marketing', width: 160, fontWeight: '500' },
        { id: 'sales', label: 'Sales Enablement', width: 160, fontWeight: '500' },
        { id: 'success', label: 'Customer Success', width: 160, fontWeight: '500' }
    ],
    links: [
        { from: 'north', to: 'west' },
        { from: 'north', to: 'east' },
        { from: 'north', to: 'design-circle' },
        { from: 'west', to: 'south' },
        { from: 'west', to: 'data-guild' },
        { from: 'west', to: 'ops-crew' },
        { from: 'east', to: 'data-guild' },
        { from: 'east', to: 'growth-pod' },
        { from: 'south', to: 'ops-crew' },
        { from: 'south', to: 'security-unit' },
        { from: 'design-circle', to: 'growth-pod' },
        { from: 'design-circle', to: 'marketing' },
        { from: 'data-guild', to: 'marketing' },
        { from: 'data-guild', to: 'sales' },
        { from: 'ops-crew', to: 'sales' },
        { from: 'ops-crew', to: 'success' },
        { from: 'growth-pod', to: 'success', options: { label: 'Playbooks' } },
        { from: 'security-unit', to: 'sales', options: { label: 'Security Review' } }
    ]
};

const cycleStages = ['Ideate', 'Prototype', 'Review', 'Plan', 'Develop', 'Launch', 'Measure', 'Learn'];

export const cycleBlueprint: GraphBlueprint = {
    nodes: cycleStages.map((label) => ({
        id: label.toLowerCase(),
        label,
        variant: 'circle',
        width: 70,
        height: 70,
        fontSize: 11,
        fontWeight: '600'
    })),
    links: [
        ...cycleStages.map((_, index, list) => ({
            from: list[index].toLowerCase(),
            to: list[(index + 1) % list.length].toLowerCase()
        })),
        { from: 'prototype', to: 'launch', options: { label: 'Pivot' } },
        { from: 'develop', to: 'ideate', options: { label: 'Backlog' } },
        { from: 'measure', to: 'review', options: { label: 'Retro' } }
    ]
};

const completeDomains: NodeSpec[] = [
    { id: 'architecture', label: 'Architecture', variant: 'pill', width: 150, fontWeight: '600' },
    { id: 'data', label: 'Data', width: 150, fontWeight: '600' },
    { id: 'infrastructure', label: 'Infrastructure', variant: 'pill', width: 150, fontWeight: '600' },
    { id: 'security', label: 'Security', width: 150, fontWeight: '600' },
    { id: 'enablement', label: 'Enablement', variant: 'pill', width: 150, fontWeight: '600' }
];

const completeLinks: LinkSpec[] = [];
for (let i = 0; i < completeDomains.length; i += 1) {
    for (let j = i + 1; j < completeDomains.length; j += 1) {
        completeLinks.push({ from: completeDomains[i].id, to: completeDomains[j].id });
    }
}

export const completeBlueprint: GraphBlueprint = {
    nodes: completeDomains,
    links: completeLinks
};

export const nestedBlueprint: GraphBlueprint = {
    nodes: [
        // Top-level ecosystem containers
        { id: 'frontend-ecosystem', label: 'Frontend Ecosystem', kind: 'parent', size: { width: 300, height: 180 } },
        { id: 'backend-ecosystem', label: 'Backend Ecosystem', kind: 'parent', size: { width: 300, height: 180 } },
        { id: 'data-ecosystem', label: 'Data Ecosystem', kind: 'parent', size: { width: 300, height: 180 } },

        // Frontend teams
        { id: 'react-team', label: 'React Team', parentId: 'frontend-ecosystem' },
        { id: 'design-system', label: 'Design System', parentId: 'frontend-ecosystem' },
        { id: 'accessibility', label: 'Accessibility', parentId: 'frontend-ecosystem' },

        // Backend teams
        { id: 'api-gateway', label: 'API Gateway', parentId: 'backend-ecosystem' },
        { id: 'microservices', label: 'Microservices', parentId: 'backend-ecosystem' },
        { id: 'database', label: 'Database', parentId: 'backend-ecosystem' },

        // Data teams
        { id: 'data-pipeline', label: 'Data Pipeline', parentId: 'data-ecosystem' },
        { id: 'ml-platform', label: 'ML Platform', parentId: 'data-ecosystem' },
        { id: 'analytics-engine', label: 'Analytics Engine', parentId: 'data-ecosystem' },
    ],
    links: [
        // Internal ecosystem flows
        { from: 'react-team', to: 'design-system', options: { label: 'Components' } },
        { from: 'design-system', to: 'accessibility', options: { label: 'Standards' } },
        { from: 'api-gateway', to: 'microservices', options: { label: 'Routes' } },
        { from: 'microservices', to: 'database', options: { label: 'Queries' } },
        { from: 'data-pipeline', to: 'ml-platform', options: { label: 'Features' } },
        { from: 'ml-platform', to: 'analytics-engine', options: { label: 'Models' } },

        // Cross-ecosystem integrations
        { from: 'frontend-ecosystem', to: 'backend-ecosystem', options: { label: 'API Calls' } },
        { from: 'backend-ecosystem', to: 'data-ecosystem', options: { label: 'Data Ingestion' } },
        { from: 'data-ecosystem', to: 'frontend-ecosystem', options: { label: 'Dashboards' } },

        // Cross-cutting technical flows
        { from: 'api-gateway', to: 'data-pipeline', options: { label: 'Event Streams' } },
        { from: 'analytics-engine', to: 'react-team', options: { label: 'User Metrics' } }
    ]
};
