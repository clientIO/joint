/* eslint-disable @typescript-eslint/no-dynamic-delete */

/* eslint-disable sonarjs/pseudo-random */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import {
  GraphProvider,
  Paper,
  useCellId,
  useGraph,
  HTMLHost,
  type CellRecord,
  type CellAttributes,
  type ElementRecord,
  type LinkRecord,
  type IncrementalCellsChange,
} from '@joint/react';
import { linkRoutingOrthogonal } from '@joint/react/presets';
import { usePaperEvents } from '../../../hooks';
import Peer, { type DataConnection } from 'peerjs';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { Provider, useSelector, useStore } from 'react-redux';

// ── Theme ───────────────────────────────────────────────────────────────────

const ThemeContext = createContext(false);
const UserContext = createContext<{ color: string; name: string }>({
  color: '#0071e3',
  name: 'You',
});
const RemoteDragContext = createContext<{ dragging: Set<string>; color: string; name: string }>({
  dragging: new Set(),
  color: '#30d158',
  name: 'Peer',
});

const DARK = {
  canvas: '#0a0a0a',
  card: '#161616',
  cardBorder: 'rgba(255,255,255,0.06)',
  text: '#f5f5f7',
  sub: 'rgba(245,245,247,0.5)',
  muted: 'rgba(245,245,247,0.25)',
  accent: '#0071e3',
  accentGlow: 'rgba(0,113,227,0.3)',
  green: '#30d158',
  orange: '#ff9f0a',
  red: '#ff453a',
  surface: '#1c1c1e',
  surfaceBorder: 'rgba(255,255,255,0.08)',
  link: 'rgba(255,255,255,0.15)',
  port: 'rgba(255,255,255,0.3)',
} as const;

const LIGHT = {
  canvas: '#f5f5f7',
  card: '#ffffff',
  cardBorder: 'rgba(0,0,0,0.06)',
  text: '#1d1d1f',
  sub: 'rgba(29,29,31,0.5)',
  muted: 'rgba(29,29,31,0.2)',
  accent: '#0071e3',
  accentGlow: 'rgba(0,113,227,0.15)',
  green: '#34c759',
  orange: '#ff9500',
  red: '#ff3b30',
  surface: '#ffffff',
  surfaceBorder: 'rgba(0,0,0,0.06)',
  link: 'rgba(0,0,0,0.12)',
  port: 'rgba(0,0,0,0.2)',
} as const;

function useTheme() {
  return useContext(ThemeContext) ? DARK : LIGHT;
}

// ── User Colors ─────────────────────────────────────────────────────────────

const USER_COLORS = ['#0071e3', '#ff9f0a', '#30d158', '#ff453a', '#bf5af2', '#64d2ff'] as const;

// ── Data ────────────────────────────────────────────────────────────────────

type AgentNodeData = {
  readonly title: string;
  readonly role: string;
  readonly icon: string;
  readonly status: 'online' | 'busy' | 'idle';
};

type AgentNode = ElementRecord<AgentNodeData>;

const ORTHOGONAL_LINKS = linkRoutingOrthogonal({ sourceOffset: 6, targetOffset: 6 });
const PORT_R = 5;

const PORT_OUT = {
  cx: 'calc(0.5 * w)',
  cy: 'calc(h)',
  width: PORT_R * 2,
  height: PORT_R * 2,
  color: DARK.port,
  outlineWidth: 0,
};
const PORT_IN = {
  cx: 'calc(0.5 * w)',
  cy: 0,
  width: PORT_R * 2,
  height: PORT_R * 2,
  color: DARK.port,
  outlineWidth: 0,
  passive: true,
};

const initialElements: Record<string, AgentNode> = {
  orchestrator: {
    id: 'orchestrator',
    type: 'element',
    data: {
      title: 'Orchestrator',
      role: 'Task delegation',
      icon: 'fas fa-brain',
      status: 'online',
    },
    position: { x: 250, y: 60 },
    portMap: { out: PORT_OUT, in: PORT_IN },
  },
  researcher: {
    id: 'researcher',
    type: 'element',
    data: {
      title: 'Researcher',
      role: 'Data gathering',
      icon: 'fas fa-search',
      status: 'busy',
    },
    position: { x: 80, y: 300 },
    portMap: { out: PORT_OUT, in: PORT_IN },
  },
  writer: {
    id: 'writer',
    type: 'element',
    data: {
      title: 'Writer',
      role: 'Content creation',
      icon: 'fas fa-pen-fancy',
      status: 'idle',
    },
    position: { x: 430, y: 300 },
    portMap: { out: PORT_OUT, in: PORT_IN },
  },
};

const initialLinks: Record<string, LinkRecord> = {
  'o-r': {
    id: 'o-r',
    type: 'link',
    source: { id: 'orchestrator', port: 'out' },
    target: { id: 'researcher', port: 'in' },
    style: { color: DARK.link, width: 1.5, targetMarker: 'none' },
    connector: { name: 'straight', args: { cornerType: 'cubic', cornerPreserveAspectRatio: true } },
  },
  'o-w': {
    id: 'o-w',
    type: 'link',
    source: { id: 'orchestrator', port: 'out' },
    target: { id: 'writer', port: 'in' },
    style: { color: DARK.link, width: 1.5, targetMarker: 'none' },
    connector: { name: 'straight', args: { cornerType: 'cubic', cornerPreserveAspectRatio: true } },
  },
};

// ── Redux Store ─────────────────────────────────────────────────────────────

interface GraphState {
  readonly elements: Record<string, ElementRecord<AgentNodeData>>;
  readonly links: Record<string, LinkRecord>;
}

function isElementType(cell: CellAttributes): cell is ElementRecord<AgentNodeData> {
  return cell.type === 'element';
}
function isLinkType(cell: CellAttributes): cell is LinkRecord {
  return cell.type === 'link';
}

const graphSlice = createSlice({
  name: 'graph',
  initialState: {
    elements: initialElements,
    links: initialLinks,
  } satisfies GraphState as GraphState,
  reducers: {
    applyIncrementalChanges: (state, action: PayloadAction<CollabChanges>) => {
      const { added, changed, removed } = action.payload;

      for (const [id, cell] of added) {
        if (isElementType(cell)) state.elements[String(id)] = cell;
        else if (isLinkType(cell)) state.links[String(id)] = cell;
      }
      for (const [id, cell] of changed) {
        if (isElementType(cell)) state.elements[String(id)] = cell;
        else if (isLinkType(cell)) state.links[String(id)] = cell;
      }
      for (const id of removed) {
        const key = String(id);
        delete state.elements[key];
        delete state.links[key];
      }
    },
  },
});

const { applyIncrementalChanges } = graphSlice.actions;

function createCollabStore() {
  return configureStore({
    reducer: { graph: graphSlice.reducer },
    devTools: true,
  });
}

type CollabStore = ReturnType<typeof createCollabStore>;
type CollabRootState = ReturnType<CollabStore['getState']>;

const selectElements = (state: CollabRootState) => state.graph.elements;
const selectLinks = (state: CollabRootState) => state.graph.links;

// ── PeerJS Manager ──────────────────────────────────────────────────────────

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

type CollabChanges = IncrementalCellsChange<ElementRecord<AgentNodeData>>;

interface SyncMessage {
  readonly type: 'incremental' | 'presence' | 'drag';
  readonly changes?: CollabChanges;
  readonly userColor?: string;
  readonly userName?: string;
  readonly draggingIds?: string[];
}

function createPeerManager(callbacks: {
  onPeerId: (id: string) => void;
  onStatus: (status: ConnectionStatus) => void;
  onRemoteChanges: (changes: CollabChanges) => void;
  onPeerPresence: (color: string, name: string) => void;
  onRemoteDrag: (ids: string[]) => void;
}) {
  let peer: Peer | null = null;
  // Outgoing connections we initiated — reliable for send()
  const outgoing: DataConnection[] = [];
  let ignoreNext = false;

  const { onPeerId, onStatus, onRemoteChanges, onPeerPresence, onRemoteDrag } = callbacks;

  peer = new Peer();
  peer.on('open', onPeerId);

  function handleData(data: unknown) {
    const message = data as SyncMessage;
    if (message.type === 'incremental' && message.changes) {
      ignoreNext = true;
      onRemoteChanges(message.changes);
      queueMicrotask(() => {
        ignoreNext = false;
      });
    }
    if (message.type === 'presence' && message.userColor && message.userName) {
      onPeerPresence(message.userColor, message.userName);
    }
    if (message.type === 'drag' && message.draggingIds) {
      onRemoteDrag(message.draggingIds);
    }
  }

  function addOutgoing(conn: DataConnection) {
    if (outgoing.includes(conn)) return;
    outgoing.push(conn);
    onStatus('connected');
    // Also listen for data on outgoing (belt and suspenders)
    conn.on('data', handleData);
    conn.on('close', () => {
      const index = outgoing.indexOf(conn);
      if (index !== -1) outgoing.splice(index, 1);
      if (outgoing.length === 0) onStatus('disconnected');
    });
  }

  function connectTo(remotePeerId: string) {
    if (!peer) return;
    // Don't create duplicate outgoing connections to the same peer
    if (outgoing.some((c) => c.peer === remotePeerId)) return;
    const conn = peer.connect(remotePeerId, { reliable: true });

    const handleOpen = () => addOutgoing(conn);
    conn.on('open', handleOpen);

    // PeerJS workaround: 'open' event sometimes doesn't fire — poll as fallback
    const poll = setInterval(() => {
      if (conn.open && !outgoing.includes(conn)) {
        clearInterval(poll);
        handleOpen();
      }
    }, 300);
    setTimeout(() => clearInterval(poll), 15_000);

    conn.on('error', () => {
      clearInterval(poll);
      onStatus('disconnected');
    });
  }

  // Incoming: only use for RECEIVING data. Then connect BACK for sending.
  // PeerJS incoming connections are unreliable for send() (see peerjs#9, #240).
  peer.on('connection', (incomingConn) => {
    incomingConn.on('data', handleData);
    onStatus('connected');
    // Connect back so we have a reliable outgoing channel
    connectTo(incomingConn.peer);
  });
  peer.on('error', (error) => {
    console.error('PeerJS:', error); // eslint-disable-line no-console
    onStatus('disconnected');
  });

  return {
    connect(remotePeerId: string) {
      onStatus('connecting');
      connectTo(remotePeerId);
    },
    sendChanges(changes: CollabChanges) {
      if (ignoreNext) return;
      const message: SyncMessage = { type: 'incremental', changes };
      for (const conn of outgoing) {
        try {
          conn.send(message);
        } catch {
          /* connection not ready */
        }
      }
    },
    sendPresence(color: string, name: string) {
      const message: SyncMessage = { type: 'presence', userColor: color, userName: name };
      for (const conn of outgoing) {
        try {
          conn.send(message);
        } catch {
          /* connection not ready */
        }
      }
    },
    sendDrag(draggingIds: string[]) {
      const message: SyncMessage = { type: 'drag', draggingIds };
      for (const conn of outgoing) {
        try {
          conn.send(message);
        } catch {
          /* connection not ready */
        }
      }
    },
    isReceiving: () => ignoreNext,
  };
}

// ── Node Component ──────────────────────────────────────────────────────────

function RenderAgentNode({ title, role, icon, status }: Readonly<AgentNodeData>) {
  const theme = useTheme();
  const isDark = theme === DARK;
  const remoteDrag = useContext(RemoteDragContext);
  const elementId = String(useCellId());
  const isRemoteDragging = remoteDrag.dragging.has(elementId);

  const statusColors: Record<string, string> = {
    online: theme.green,
    busy: theme.orange,
    idle: theme.muted,
  };
  const statusColor = statusColors[status] ?? theme.muted;

  const isActive = isRemoteDragging;
  const activeName = remoteDrag.name;
  const activeColor = remoteDrag.color;

  let borderColor: string = theme.cardBorder;
  if (isActive) borderColor = activeColor;

  const defaultShadow = `0 2px 12px rgba(0,0,0,${isDark ? 0.3 : 0.06})`;
  const activeShadow = isDark
    ? `0 0 0 1px ${activeColor}, 0 20px 60px rgba(0,0,0,0.7), 0 0 30px ${activeColor}44`
    : `0 20px 50px rgba(0,0,0,0.12), 0 0 0 1px ${activeColor}55`;
  const cardShadow = isActive ? activeShadow : defaultShadow;

  const defaultIconBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const iconBg = defaultIconBg;
  const iconColor = theme.sub;
  const iconGlow = 'none';

  return (
    <>
      <HTMLHost
        className="select-none"
        style={{
          width: 220,
          padding: '14px 16px',
          borderRadius: 16,
          cursor: 'grab',
          backgroundColor: theme.card,
          border: `1px solid ${borderColor}`,
          boxShadow: cardShadow,
          transition: 'transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0"
            style={{
              backgroundColor: iconBg,
              color: iconColor,
              boxShadow: iconGlow,
              transition: 'all 120ms ease',
            }}
          >
            <i className={icon} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className="text-[13px] font-medium"
                style={{ color: theme.text, letterSpacing: '-0.01em' }}
              >
                {title}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: statusColor }}
              />
              <span className="text-[11px]" style={{ color: theme.sub }}>
                {role}
              </span>
            </div>
          </div>
        </div>

        {/* User badge — floats above the card when anyone drags */}
        {isActive && (
          <div
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{
              top: -28,
              backgroundColor: activeColor,
              color: '#fff',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.02em',
              boxShadow: `0 2px 8px ${activeColor}66`,
              whiteSpace: 'nowrap',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
            {activeName}
          </div>
        )}
      </HTMLHost>
    </>
  );
}

// ── Connection Panel ────────────────────────────────────────────────────────

interface ConnectionPanelProps {
  readonly peerId: string | null;
  readonly status: ConnectionStatus;
  readonly peerColor: string | null;
  readonly peerName: string | null;
  readonly onConnect: (remotePeerId: string) => void;
}

function ConnectionPanel({
  peerId,
  status,
  peerColor,
  peerName,
  onConnect,
}: Readonly<ConnectionPanelProps>) {
  const theme = useTheme();
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!peerId) return;
    await navigator.clipboard.writeText(peerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="absolute top-4 left-4 z-10 flex flex-col gap-2.5"
      style={{
        width: 260,
        padding: '14px 16px',
        borderRadius: 16,
        backgroundColor: theme.surface,
        border: `1px solid ${theme.surfaceBorder}`,
        boxShadow: `0 4px 24px rgba(0,0,0,${theme === DARK ? 0.4 : 0.08})`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Your ID */}
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: peerId ? theme.green : theme.muted }}
        />
        <span className="text-[11px] font-medium" style={{ color: theme.sub }}>
          {peerId ? 'Online' : 'Connecting...'}
        </span>
      </div>

      {peerId && (
        <div className="flex items-center gap-1.5">
          <code
            className="flex-1 text-[10px] truncate px-2.5 py-1.5 rounded-lg"
            style={{
              backgroundColor: theme === DARK ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              color: theme.text,
              fontFamily: 'SF Mono, Menlo, monospace',
            }}
          >
            {peerId}
          </code>
          <button
            className="text-[10px] font-medium px-2.5 py-1.5 rounded-lg border-0 cursor-pointer shrink-0"
            style={{
              backgroundColor: copied ? theme.green : theme.accent,
              color: '#fff',
              transition: 'background-color 150ms',
            }}
            onClick={handleCopy}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}

      {/* Connect */}
      {status !== 'connected' && (
        <div className="flex items-center gap-1.5">
          <input
            className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg border-0 outline-none"
            style={{
              backgroundColor: theme === DARK ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              color: theme.text,
            }}
            placeholder="Paste peer ID"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && input.trim()) onConnect(input.trim());
            }}
            disabled={!peerId || status === 'connecting'}
          />
          <button
            className="text-[10px] font-medium px-2.5 py-1.5 rounded-lg border-0 cursor-pointer shrink-0"
            style={{
              backgroundColor: theme.accent,
              color: '#fff',
              opacity: !input.trim() || !peerId ? 0.4 : 1,
            }}
            onClick={() => {
              if (input.trim()) onConnect(input.trim());
            }}
            disabled={!input.trim() || !peerId}
          >
            {status === 'connecting' ? '...' : 'Join'}
          </button>
        </div>
      )}

      {/* Connected peer */}
      {status === 'connected' && peerColor && (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: peerColor }} />
          <span className="text-[11px]" style={{ color: theme.sub }}>
            {peerName ?? 'Peer'} connected
          </span>
        </div>
      )}

      {/* Hint */}
      {status === 'disconnected' && peerId && (
        <div
          className="text-[10px] leading-relaxed rounded-lg px-2.5 py-2 mt-0.5"
          style={{
            color: theme.muted,
            backgroundColor: theme === DARK ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
          }}
        >
          Open this page in another tab, copy the peer ID and paste it here to collaborate in
          real-time.
        </div>
      )}
    </div>
  );
}

// ── Toolbar ─────────────────────────────────────────────────────────────────

const SIMULATE_NODES = [
  { id: 'orchestrator', label: 'Orchestrator', icon: 'fas fa-brain' },
  { id: 'researcher', label: 'Researcher', icon: 'fas fa-search' },
  { id: 'writer', label: 'Writer', icon: 'fas fa-pen-fancy' },
] as const;

function Toolbar() {
  const theme = useTheme();
  const isDark = theme === DARK;
  const { setCell } = useGraph<ElementRecord<AgentNodeData>>();
  const reduxStore = useStore<CollabRootState>();
  const [simulating, setSimulating] = useState<Set<string>>(() => new Set());
  const intervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  const toggleSimulate = useCallback(
    (nodeId: string) => {
      setSimulating((previous) => {
        const next = new Set(previous);
        if (next.has(nodeId)) {
          // Stop
          next.delete(nodeId);
          const interval = intervalsRef.current.get(nodeId);
          if (interval) {
            clearInterval(interval);
            intervalsRef.current.delete(nodeId);
          }
        } else {
          // Start
          next.add(nodeId);
          const state = reduxStore.getState().graph.elements[nodeId] as AgentNode | undefined;
          if (!state) return previous;

          const centerX = state.position?.x ?? 250;
          const centerY = state.position?.y ?? 200;
          const radius = 30 + Math.random() * 40;
          let angle = Math.random() * Math.PI * 2;
          const speed = 0.03 + Math.random() * 0.02;

          const interval = setInterval(() => {
            angle += speed;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            const current = reduxStore.getState().graph.elements[nodeId];
            if (!current) return;

            setCell({ id: nodeId, position: { x, y } } as CellRecord<AgentNodeData>);
          }, 30);

          intervalsRef.current.set(nodeId, interval);
        }
        return next;
      });
    },
    [reduxStore, setCell]
  );

  useEffect(() => {
    const refs = intervalsRef.current;
    return () => {
      for (const interval of refs.values()) clearInterval(interval);
      refs.clear();
    };
  }, []);

  const addAgent = useCallback(() => {
    const id = `agent-${Date.now()}`;
    const agents = [
      { title: 'Coder', role: 'Code generation', icon: 'fas fa-code', status: 'online' as const },
      {
        title: 'Reviewer',
        role: 'Quality assurance',
        icon: 'fas fa-check-circle',
        status: 'idle' as const,
      },
      {
        title: 'Planner',
        role: 'Task planning',
        icon: 'fas fa-project-diagram',
        status: 'busy' as const,
      },
      { title: 'Debugger', role: 'Error analysis', icon: 'fas fa-bug', status: 'online' as const },
    ];
    const pick = agents[Math.floor(Math.random() * agents.length)];
    setCell({
      id,
      type: 'element',
      data: pick,
      position: { x: 100 + Math.random() * 300, y: 100 + Math.random() * 300 },
      portMap: {
        out: {
          cx: 'calc(0.5 * w)',
          cy: 'calc(h)',
          width: PORT_R * 2,
          height: PORT_R * 2,
          color: theme.port,
          outlineWidth: 0,
        },
        in: {
          cx: 'calc(0.5 * w)',
          cy: 0,
          width: PORT_R * 2,
          height: PORT_R * 2,
          color: theme.port,
          outlineWidth: 0,
          passive: true,
        },
      },
    } satisfies AgentNode);
  }, [setCell, theme]);

  return (
    <div
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-1.5 py-1.5 rounded-2xl"
      style={{
        backgroundColor: theme.surface,
        border: `1px solid ${theme.surfaceBorder}`,
        boxShadow: `0 4px 24px rgba(0,0,0,${isDark ? 0.4 : 0.08})`,
      }}
    >
      <button
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer whitespace-nowrap"
        style={{ backgroundColor: theme.accent, color: '#fff', border: 'none' }}
        onClick={addAgent}
      >
        Add +
      </button>

      <div style={{ width: 1, height: 16, backgroundColor: theme.surfaceBorder }} />

      <span className="text-[10px] px-1.5" style={{ color: theme.muted }}>
        Simulate
      </span>

      {SIMULATE_NODES.map((node) => {
        const isActive = simulating.has(node.id);
        const activeBg = isDark ? 'rgba(48,209,88,0.15)' : 'rgba(52,199,89,0.12)';
        const inactiveBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
        return (
          <button
            key={node.id}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium cursor-pointer"
            style={{
              backgroundColor: isActive ? activeBg : inactiveBg,
              color: isActive ? theme.green : theme.sub,
              border: isActive ? `1px solid ${theme.green}44` : '1px solid transparent',
              transition: 'all 150ms',
            }}
            onClick={() => toggleSimulate(node.id)}
          >
            <i className={node.icon} style={{ fontSize: 9 }} />
            {node.label}
            {isActive && (
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: theme.green, animation: 'pulse 1.5s infinite' }}
              />
            )}
          </button>
        );
      })}

      <div style={{ width: 1, height: 16, backgroundColor: theme.surfaceBorder }} />

      <button
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-medium cursor-pointer"
        style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          color: theme.sub,
          border: 'none',
          transition: 'background-color 150ms',
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
        </svg>
        Fit
      </button>
    </div>
  );
}

// ── Drag Tracker (broadcasts local drags to peers) ─────────────────────────

function DragTracker({ manager }: Readonly<{ manager: ReturnType<typeof createPeerManager> }>) {
  usePaperEvents(PAPER_ID, () => {
    const dragging = new Set<string>();
    return {
      'element:pointerdown': (elementView) => {
        dragging.add(String(elementView.model.id));
        manager.sendDrag([...dragging]);
      },
      'element:pointerup': (elementView) => {
        dragging.delete(String(elementView.model.id));
        manager.sendDrag([...dragging]);
      },
    };
  }, [manager]);
  return null;
}

// ── Main ────────────────────────────────────────────────────────────────────

const PAPER_ID = 'collab-paper';

function GraphWithRedux() {
  const isDark = useContext(ThemeContext);
  const theme = isDark ? DARK : LIGHT;

  const elements = useSelector(selectElements);
  const links = useSelector(selectLinks);
  const reduxStore = useStore<CollabRootState>();
  const { dispatch } = reduxStore;

  const [peerId, setPeerId] = useState<string | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [peerColor, setPeerColor] = useState<string | null>(null);
  const [peerName, setPeerName] = useState<string | null>(null);

  const [myColor] = useState<string>(
    () => USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]
  );
  const [remoteDragging, setRemoteDragging] = useState<Set<string>>(() => new Set());

  const [manager] = useState(() =>
    createPeerManager({
      onPeerId: setPeerId,
      onStatus: setStatus,
      onRemoteChanges: (changes) => {
        dispatch(applyIncrementalChanges(changes));
      },
      onRemoteDrag: (ids) => {
        setRemoteDragging(new Set(ids));
      },
      onPeerPresence: (color, name) => {
        setPeerColor(color);
        setPeerName(name);
      },
    })
  );

  const handleConnect = useCallback(
    (remotePeerId: string) => {
      manager.connect(remotePeerId);
      // Send presence after short delay to let connection establish
      setTimeout(() => {
        manager.sendPresence(myColor, peerId ?? 'Peer');
      }, 1000);
    },
    [manager, myColor, peerId]
  );

  const handleIncrementalChange = useCallback(
    (changes: CollabChanges) => {
      dispatch(applyIncrementalChanges(changes));
      manager.sendChanges(changes);
    },
    [dispatch, manager]
  );

  // Merge elements + links into a single readonly CellRecord[] array (themed).
  const themedCells = useMemo<ReadonlyArray<CellRecord<AgentNodeData>>>(() => {
    const cells: Array<CellRecord<AgentNodeData>> = [];
    for (const [id, element] of Object.entries(elements)) {
      cells.push({
        ...element,
        id,
        type: 'element',
        portMap: {
          out: {
            cx: 'calc(0.5 * w)',
            cy: 'calc(h)',
            width: PORT_R * 2,
            height: PORT_R * 2,
            color: theme.port,
            outlineWidth: 0,
          },
          in: {
            cx: 'calc(0.5 * w)',
            cy: 0,
            width: PORT_R * 2,
            height: PORT_R * 2,
            color: theme.port,
            outlineWidth: 0,
            passive: true,
          },
        },
      });
    }
    for (const [id, link] of Object.entries(links)) {
      cells.push({
        ...link,
        id,
        type: 'link',
        style: { ...link.style, color: theme.link },
      });
    }
    return cells;
  }, [elements, links, theme]);

  return (
    <UserContext.Provider value={{ color: myColor, name: 'You' }}>
      <RemoteDragContext.Provider
        value={{
          dragging: remoteDragging,
          color: peerColor ?? '#30d158',
          name: peerName ? peerName.slice(0, 6) : 'Peer',
        }}
      >
        <GraphProvider
          initialCells={themedCells}
          onIncrementalCellsChange={handleIncrementalChange}
        >
          <Paper
            id={PAPER_ID}
            height="100%"
            width="100%"
            gridSize={1}
            overflow
            linkPinning={false}
            snapLinks={{ radius: 30 }}
            magnetThreshold="onleave"
            clickThreshold={10}
            {...ORTHOGONAL_LINKS}
            defaultLink={{ style: { color: theme.link, width: 1.5, targetMarker: 'none' } }}
            validateConnection={({ target }) => target.port === 'in'}
            interactive={(cellView) => (cellView.model.isLink() ? false : { linkMove: false })}
            renderElement={RenderAgentNode}
            style={{ backgroundColor: theme.canvas }}
          />
          <ConnectionPanel
            peerId={peerId}
            status={status}
            peerColor={peerColor}
            peerName={peerName}
            onConnect={handleConnect}
          />
          <DragTracker manager={manager} />
          <Toolbar />
        </GraphProvider>
      </RemoteDragContext.Provider>
    </UserContext.Provider>
  );
}

// ── Theme Switch ────────────────────────────────────────────────────────────

function ThemeSwitch({ isDark, onClick }: Readonly<{ isDark: boolean; onClick: () => void }>) {
  return (
    <button
      onClick={onClick}
      title="Toggle theme"
      className="absolute top-4 right-4 z-10 w-[48px] h-[26px] rounded-full cursor-pointer border-0"
      style={{
        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
        transition: 'background-color 200ms',
      }}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke={isDark ? '#f5f5f7' : '#ff9500'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute top-[7px] left-[6px]"
      >
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill={isDark ? 'rgba(255,255,255,0.3)' : '#1d1d1f'}
        className="absolute top-[7px] right-[6px]"
      >
        <path d="M12.0557 3.59974C12.2752 3.2813 12.2913 2.86484 12.0972 2.53033C11.9031 2.19582 11.5335 2.00324 11.1481 2.03579C6.02351 2.46868 2 6.76392 2 12C2 17.5228 6.47715 22 12 22C17.236 22 21.5313 17.9764 21.9642 12.8518C21.9967 12.4664 21.8041 12.0968 21.4696 11.9027C21.1351 11.7086 20.7187 11.7248 20.4002 11.9443C19.4341 12.6102 18.2641 13 17 13C13.6863 13 11 10.3137 11 6.99996C11 5.73589 11.3898 4.56587 12.0557 3.59974Z" />
      </svg>
      <div
        className="w-[20px] h-[20px] rounded-full absolute top-[3px]"
        style={{
          transform: isDark ? 'translateX(24px)' : 'translateX(3px)',
          backgroundColor: isDark ? '#f5f5f7' : '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          transition: 'transform 300ms ease',
        }}
      />
    </button>
  );
}

// ── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const theme = isDark ? DARK : LIGHT;
  const [store] = useState(createCollabStore);

  return (
    <ThemeContext.Provider value={isDark}>
      <Provider store={store}>
        <div
          className="relative w-full h-[680px] rounded-2xl overflow-hidden"
          style={{
            backgroundColor: theme.canvas,
            border: `1px solid ${theme.surfaceBorder}`,
            transition: 'background-color 300ms, border-color 300ms',
          }}
        >
          <GraphWithRedux />
          <ThemeSwitch isDark={isDark} onClick={() => setIsDark((v) => !v)} />
        </div>
      </Provider>
    </ThemeContext.Provider>
  );
}
