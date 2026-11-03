import { dia } from '@joint/core';

export type FileKind = 'photo' | 'video' | 'document' | 'music' | 'archive';

export interface FileData {
    name: string;
    sizeMB: number;
    // Width / height of the tile - its area is set by `sizeMB` alone.
    ratio: number;
}

interface FolderData {
    id: string;
    name: string;
    kind: FileKind;
    files: FileData[];
}

// A fixed snapshot of a storage drive: every folder is a container, every file
// a tile whose area is proportional to the file's size - so the packed board
// doubles as a rough "what takes up my disk space" overview.
const folders: FolderData[] = [{
    id: 'photos',
    name: 'Photos',
    kind: 'photo',
    files: [
        { name: 'beach.jpg', sizeMB: 48, ratio: 1.5 },
        { name: 'sunset.jpg', sizeMB: 36, ratio: 1.5 },
        { name: 'portrait.png', sizeMB: 64, ratio: 0.7 },
        { name: 'panorama.jpg', sizeMB: 120, ratio: 3 },
        { name: 'family.heic', sizeMB: 22, ratio: 1.3 },
        { name: 'skyline.raw', sizeMB: 96, ratio: 1.5 },
        { name: 'cat.jpg', sizeMB: 18, ratio: 1 }
    ]
}, {
    id: 'videos',
    name: 'Videos',
    kind: 'video',
    files: [
        { name: 'wedding.mp4', sizeMB: 420, ratio: 1.8 },
        { name: 'trip-vlog.mov', sizeMB: 310, ratio: 1.8 },
        { name: 'drone.mp4', sizeMB: 180, ratio: 1.8 },
        { name: 'clip.webm', sizeMB: 40, ratio: 1.8 }
    ]
}, {
    id: 'documents',
    name: 'Documents',
    kind: 'document',
    files: [
        { name: 'thesis.pdf', sizeMB: 32, ratio: 0.75 },
        { name: 'budget.xlsx', sizeMB: 12, ratio: 1.4 },
        { name: 'notes.md', sizeMB: 6, ratio: 1 },
        { name: 'contract.docx', sizeMB: 14, ratio: 0.75 },
        { name: 'slides.pptx', sizeMB: 58, ratio: 1.6 },
        { name: 'scan.pdf', sizeMB: 26, ratio: 0.75 },
        { name: 'invoice.pdf', sizeMB: 8, ratio: 0.75 },
        { name: 'resume.pdf', sizeMB: 6, ratio: 0.75 }
    ]
}, {
    id: 'music',
    name: 'Music',
    kind: 'music',
    files: [
        { name: 'album.flac', sizeMB: 160, ratio: 1 },
        { name: 'live-set.wav', sizeMB: 110, ratio: 2 },
        { name: 'single.mp3', sizeMB: 9, ratio: 1 },
        { name: 'podcast.mp3', sizeMB: 54, ratio: 1.2 },
        { name: 'demo.ogg', sizeMB: 12, ratio: 1 }
    ]
}, {
    id: 'archives',
    name: 'Archives',
    kind: 'archive',
    files: [
        { name: 'backup-2024.zip', sizeMB: 260, ratio: 1.2 },
        { name: 'project.tar.gz', sizeMB: 75, ratio: 1 },
        { name: 'fonts.7z', sizeMB: 20, ratio: 1.6 }
    ]
}];

// Area per MB, and the smallest a tile may get so its label stays readable.
const PX2_PER_MB = 110;
const MIN_TILE_AREA = 96 * 52;
const MIN_TILE_WIDTH = 90;
const MIN_TILE_HEIGHT = 44;

/** A tile's size - its area proportional to the file size, its shape given by `ratio`. */
export function getTileSize({ sizeMB, ratio }: FileData): dia.Size {
    const area = Math.max(MIN_TILE_AREA, sizeMB * PX2_PER_MB);
    const width = Math.max(MIN_TILE_WIDTH, Math.round(Math.sqrt(area * ratio)));
    const height = Math.max(MIN_TILE_HEIGHT, Math.round(area / width));
    return { width, height };
}

export function createFileJSON(folderId: string, kind: FileKind, file: FileData): dia.Cell.JSON {
    const size = getTileSize(file);
    return {
        id: `${folderId}/${file.name}`,
        type: 'example.FileTile',
        parent: folderId,
        kind,
        size,
        // The size ELK starts from on every layout - see `index.ts`'s `exportElement`.
        baseSize: size,
        attrs: {
            body: { class: `md-tile md-tile-${kind}` },
            label: { text: `${file.name}\n${file.sizeMB} MB` }
        }
    };
}

export const graphJSON: dia.Graph.JSON = {
    cells: folders.flatMap(({ id, name, kind, files }) => [{
        id,
        type: 'example.Folder',
        kind,
        attrs: { label: { text: name } }
    },
    ...files.map((file) => createFileJSON(id, kind, file))
    // Each folder comes right before its own files, so it renders below them.
    ]).map((cell, index) => ({ ...cell, z: index + 1 }))
};
