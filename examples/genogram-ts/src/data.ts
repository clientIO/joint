export interface PersonNode {
    id: number;
    name: string;
    sex: 'M' | 'F' | '?';
    mother?: number;
    father?: number;
    dob?: string;
    dod?: string;
    multiple?: number;
    identical?: number;
    adopted?: boolean;
}

export interface ParentChildLink {
    parentId: number;
    childId: number;
}

export interface MateLink {
    from: number;
    to: number;
}

/** Derive parent-child links from each person's `mother` and `father` fields. */
export function getParentChildLinks(persons: PersonNode[]): ParentChildLink[] {
    const links: ParentChildLink[] = [];
    const personIds = new Set(persons.map((p) => p.id));

    for (const person of persons) {
        if (typeof person.mother === 'number' && personIds.has(person.mother)) {
            links.push({ parentId: person.mother, childId: person.id });
        }
        if (typeof person.father === 'number' && personIds.has(person.father)) {
            links.push({ parentId: person.father, childId: person.id });
        }
    }

    return links;
}

/** Derive mate (couple) links from shared children — two persons who appear as mother and father of the same child are mates. */
export function getMateLinks(persons: PersonNode[]): MateLink[] {
    const couples = new Set<string>();
    const links: MateLink[] = [];

    for (const person of persons) {
        if (typeof person.mother === 'number' && typeof person.father === 'number') {
            const pairKey = `${person.father}|${person.mother}`;
            if (couples.has(pairKey)) continue;
            couples.add(pairKey);
            links.push({ from: person.father, to: person.mother });
        }
    }

    return links;
}
