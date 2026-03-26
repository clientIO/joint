/* eslint-disable sonarjs/pseudo-random */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */

/**
 * ============================================================================
 * PEERJS COLLABORATIVE MODE TUTORIAL
 * ============================================================================
 *
 * This example demonstrates how to share graph state between multiple peers
 * using PeerJS for real-time collaboration. Multiple users can connect and
 * see each other's changes in real-time.
 *
 * KEY CONCEPTS:
 *
 * 1. **PeerJS**: A WebRTC library that enables peer-to-peer connections
 *    between browsers without a server (except for signaling).
 *
 * 2. **State Synchronization**: When one peer updates the graph, the change
 *    is sent to all connected peers via PeerJS data channels.
 *
 * 3. **Controlled Mode**: We use React-controlled mode (onElementsChange/onLinksChange)
 *    to manage state, and sync that state across peers using PeerJS.
 *
 * 4. **Connection Flow**:
 *    - Each peer gets a unique ID when they load the page
 *    - One peer can connect to another by entering their ID
 *    - Once connected, state changes are synchronized bidirectionally
 *
 * HOW IT WORKS:
 *
 * 1. Peer A loads page -> Gets ID "abc123"
 * 2. Peer B loads page -> Gets ID "xyz789"
 * 3. Peer A enters "xyz789" -> Connects to Peer B
 * 4. Peer A adds element -> State updates -> Sent to Peer B via PeerJS
 * 5. Peer B receives update -> Updates local state -> Graph updates
 *
 * ============================================================================
 */

import {
  GraphProvider,
  useElementSize,
  type GraphProps,
  type ElementInput,
  type LinkInput,
  Paper,
} from '@joint/react';
import '../../examples/index.css';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { useCallback, useRef, useState } from 'react';
import Peer, { type DataConnection } from 'peerjs';

// ============================================================================
// STEP 1: Define Initial Graph Data
// ============================================================================

/**
 * Custom element data with a label property.
 */
type ElementData = { label: string };

type CustomElement = ElementInput<ElementData>;

const defaultElements: Record<string, CustomElement> = {
  '1': { data: { label: 'Hello' }, x: 100, y: 15, width: 100, height: 50 },
  '2': { data: { label: 'World' }, x: 100, y: 200, width: 100, height: 50 },
};

const defaultLinks: Record<string, LinkInput> = {
  'e1-2': {
    source: '1',
    target: '2',
    color: PRIMARY,
  },
};

// ============================================================================
// STEP 2: Custom Element Renderer
// ============================================================================

function RenderItem({ label }: Readonly<ElementData>) {
  const { width, height } = useElementSize();
  return (
    <foreignObject width={width} height={height}>
      <div className="node">{label}</div>
    </foreignObject>
  );
}

// ============================================================================
// STEP 3: PeerJS State Manager
// ============================================================================

/**
 * Message types for PeerJS communication.
 * We send structured messages to synchronize state between peers.
 */
interface StateSyncMessage {
  type: 'state-update';
  elements: Record<string, CustomElement>;
  links: Record<string, LinkInput>;
}

/**
 * Creates a PeerJS state manager that syncs graph state across peers.
 *
 * This manager:
 * 1. Manages PeerJS connections
 * 2. Sends state updates to connected peers when local state changes
 * 3. Receives state updates from peers and notifies React via callbacks
 *
 * The key advantage: ALL state changes (including position changes from dragging)
 * are automatically captured and synced, because GraphProvider calls
 * onElementsChange/onLinksChange for every change.
 */
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

function createPeerJSManager(callbacks: {
  onPeerIdChange: (id: string | null) => void;
  onConnectionStatusChange: (status: ConnectionStatus) => void;
  onConnectedPeerIdChange: (id: string | null) => void;
  onRemoteStateUpdate: (elements: Record<string, CustomElement>, links: Record<string, LinkInput>) => void;
}): {
  connectToPeer: (remotePeerId: string) => void;
  sendStateUpdate: (elements: Record<string, CustomElement>, links: Record<string, LinkInput>) => void;
  isReceivingUpdate: () => boolean;
} {
  // PeerJS connection management
  let peerRef: Peer | null = null;
  const connectionsRef: DataConnection[] = [];
  let isReceiving = false;

  const { onPeerIdChange, onConnectionStatusChange, onConnectedPeerIdChange, onRemoteStateUpdate } = callbacks;

  // Send state update to all connected peers
  const sendStateUpdate = (elements: Record<string, CustomElement>, links: Record<string, LinkInput>) => {
    // Don't send if we're currently receiving an update (prevent loops)
    if (isReceiving) {
      return;
    }

    const message: StateSyncMessage = {
      type: 'state-update',
      elements,
      links,
    };

    // Send to all connected peers
    for (const conn of connectionsRef) {
      if (conn.open) {
        conn.send(message);
      }
    }
  };

  // Handle incoming state update from peer
  const handlePeerUpdate = (message: StateSyncMessage) => {
    if (message.type === 'state-update') {
      isReceiving = true;
      onRemoteStateUpdate(message.elements, message.links);
      // Reset flag after a short delay
      setTimeout(() => {
        isReceiving = false;
      }, 100);
    }
  };

  // Initialize PeerJS peer
  const peer = new Peer();
  peerRef = peer;

  peer.on('open', (id) => {
    onPeerIdChange(id);
  });

  // Handle incoming connections
  peer.on('connection', (conn) => {
    connectionsRef.push(conn);
    onConnectionStatusChange('connected');
    onConnectedPeerIdChange(conn.peer);

    conn.on('data', (data) => {
      handlePeerUpdate(data as StateSyncMessage);
    });

    conn.on('close', () => {
      const index = connectionsRef.indexOf(conn);
      if (index !== -1) {
        connectionsRef.splice(index, 1);
      }
      if (connectionsRef.length === 0) {
        onConnectionStatusChange('disconnected');
        onConnectedPeerIdChange(null);
      }
    });
  });

  peer.on('error', (error) => {
    // eslint-disable-next-line no-console
    console.error('PeerJS error:', error);
    if (error.type === 'peer-unavailable') {
      onConnectionStatusChange('disconnected');
      alert('Peer not found. Make sure the peer ID is correct and the peer is online.');
    }
  });

  // Connect to another peer
  const connectToPeer = (remotePeerId: string) => {
    if (!peerRef) {
      return;
    }

    onConnectionStatusChange('connecting');

    const conn = peerRef.connect(remotePeerId);

    const handleConnectionOpen = () => {
      connectionsRef.push(conn);
      onConnectionStatusChange('connected');
      onConnectedPeerIdChange(remotePeerId);
    };

    if (conn.open) {
      handleConnectionOpen();
    } else {
      conn.on('open', handleConnectionOpen);

      // Workaround: PeerJS sometimes doesn't fire 'open' event - poll connection state
      let connectionHandled = false;
      const pollInterval = setInterval(() => {
        if (conn.open && !connectionHandled) {
          connectionHandled = true;
          clearInterval(pollInterval);
          handleConnectionOpen();
        }
      }, 500);

      // Clear polling after 10 seconds to avoid memory leak
      setTimeout(() => {
        clearInterval(pollInterval);
      }, 10_000);
    }

    conn.on('data', (data) => {
      handlePeerUpdate(data as StateSyncMessage);
    });

    conn.on('close', () => {
      const index = connectionsRef.indexOf(conn);
      if (index !== -1) {
        connectionsRef.splice(index, 1);
      }
      if (connectionsRef.length === 0) {
        onConnectionStatusChange('disconnected');
        onConnectedPeerIdChange(null);
      }
    });

    conn.on('error', (error) => {
      // eslint-disable-next-line no-console
      console.error('Connection error:', error);
      onConnectionStatusChange('disconnected');
    });
  };

  return {
    connectToPeer,
    sendStateUpdate,
    isReceivingUpdate: () => isReceiving,
  };
}

// ============================================================================
// STEP 4: Paper Component with Controls
// ============================================================================

interface PaperAppProps {
  readonly onAddElement: () => void;
  readonly onRemoveLast: () => void;
}

function PaperApp({ onAddElement, onRemoveLast }: Readonly<PaperAppProps>) {
  return (
    <div className="flex flex-col gap-4">
      <Paper className={PAPER_CLASSNAME} height={400} renderElement={RenderItem} />
      {/* Dark-themed controls matching the connection panel */}
      <div className="flex flex-wrap gap-2 justify-start p-4 bg-gray-800 rounded-lg border border-gray-700">
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
          onClick={onAddElement}
        >
          Add Element
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
          onClick={onRemoveLast}
        >
          Remove Last
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// STEP 5: Main Component with PeerJS Integration
// ============================================================================

function Main() {
  const [remotePeerId, setRemotePeerId] = useState('');
  const [peerId, setPeerId] = useState<string | null>(null);
  const [connectedPeerId, setConnectedPeerId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Graph state managed by React
  const [elements, setElements] = useState<Record<string, CustomElement>>(defaultElements);
  const [links, setLinks] = useState<Record<string, LinkInput>>(defaultLinks);

  // Refs to track latest state — avoids stale closures in callbacks
  // captured once by GraphStore at creation time.
  const elementsRef = useRef(elements);
  const linksRef = useRef(links);
  elementsRef.current = elements;
  linksRef.current = links;

  // Create PeerJS manager (only once) with callbacks passed at creation time
  const [peerManager] = useState(() =>
    createPeerJSManager({
      onPeerIdChange: setPeerId,
      onConnectionStatusChange: setConnectionStatus,
      onConnectedPeerIdChange: setConnectedPeerId,
      onRemoteStateUpdate: (remoteElements, remoteLinks) => {
        setElements(remoteElements);
        setLinks(remoteLinks);
      },
    })
  );

  // When graph changes locally, send to peers.
  // These callbacks are stable (no state in deps) because they use refs.
  // GraphStore captures them once at creation — stability is critical.
  const handleElementsChange = useCallback(
    (action: React.SetStateAction<Record<string, CustomElement>>) => {
      setElements((previous) => {
        const next = typeof action === 'function' ? action(previous) : action;
        elementsRef.current = next;
        if (!peerManager.isReceivingUpdate()) {
          peerManager.sendStateUpdate(next, linksRef.current);
        }
        return next;
      });
    },
    [peerManager]
  );

  const handleLinksChange = useCallback(
    (action: React.SetStateAction<Record<string, LinkInput>>) => {
      setLinks((previous) => {
        const next = typeof action === 'function' ? action(previous) : action;
        linksRef.current = next;
        if (!peerManager.isReceivingUpdate()) {
          peerManager.sendStateUpdate(elementsRef.current, next);
        }
        return next;
      });
    },
    [peerManager]
  );

  const handleConnect = () => {
    if (remotePeerId.trim()) {
      peerManager.connectToPeer(remotePeerId.trim());
      setConnectionStatus('connecting');
    }
  };

  const handleCopyId = async () => {
    if (peerId) {
      try {
        await navigator.clipboard.writeText(peerId);
        setCopyFeedback(true);
        setTimeout(() => {
          setCopyFeedback(false);
        }, 2000);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to copy ID:', error);
      }
    }
  };

  const handleAddElement = useCallback(() => {
    const newId = Math.random().toString(36).slice(7);
    const newElement: CustomElement = {
      data: { label: 'New Node' },
      x: Math.random() * 200,
      y: Math.random() * 200,
      width: 100,
      height: 50,
    };
    setElements((previous) => {
      const next = { ...previous, [newId]: newElement };
      elementsRef.current = next;
      peerManager.sendStateUpdate(next, linksRef.current);
      return next;
    });
  }, [peerManager]);

  const handleRemoveLast = useCallback(() => {
    setElements((previousElements) => {
      const elementIds = Object.keys(previousElements);
      if (elementIds.length === 0) return previousElements;

      const removedElementId = elementIds.at(-1);
      if (!removedElementId) return previousElements;

      // eslint-disable-next-line sonarjs/no-unused-vars
      const { [removedElementId]: _removed, ...newElements } = previousElements;

      // Remove connected links
      setLinks((previousLinks) => {
        const newLinks: Record<string, LinkInput> = {};
        for (const [id, link] of Object.entries(previousLinks)) {
          if (link.source !== removedElementId && link.target !== removedElementId) {
            newLinks[id] = link;
          }
        }
        elementsRef.current = newElements;
        linksRef.current = newLinks;
        peerManager.sendStateUpdate(newElements, newLinks);
        return newLinks;
      });

      return newElements;
    });
  }, [peerManager]);

  return (
    <div className="flex flex-col gap-4">
      {/* Peer Connection UI - Dark Theme */}
      <div className="flex flex-col gap-3 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-200">Your ID:</span>
          {peerId ? (
            <div className="flex items-center gap-2 flex-1">
              <code className="px-3 py-1.5 bg-gray-900 rounded border border-gray-600 font-mono text-sm text-gray-100 flex-1">
                {peerId}
              </code>
              <button
                type="button"
                onClick={handleCopyId}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  copyFeedback
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                title="Copy ID to clipboard"
              >
                {copyFeedback ? 'Copied!' : 'Copy'}
              </button>
            </div>
          ) : (
            <span className="text-gray-400">Connecting...</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-200">Status:</span>
          {(() => {
            let statusClassName = 'px-3 py-1.5 rounded text-sm font-medium ';
            let statusText = '';

            if (connectionStatus === 'connected') {
              statusClassName += 'bg-green-900 text-green-200';
              statusText = `Connected to ${connectedPeerId}`;
            } else if (connectionStatus === 'connecting') {
              statusClassName += 'bg-yellow-900 text-yellow-200';
              statusText = 'Connecting...';
            } else {
              statusClassName += 'bg-gray-700 text-gray-300';
              statusText = 'Disconnected';
            }

            return <span className={statusClassName}>{statusText}</span>;
          })()}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Enter peer ID to connect"
            value={remotePeerId}
            onChange={(event) => setRemotePeerId(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleConnect();
              }
            }}
            className="px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-gray-100 placeholder-gray-500 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!peerId || connectionStatus === 'connected'}
          />
          <button
            type="button"
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded font-medium transition-colors"
            onClick={handleConnect}
            disabled={!peerId || connectionStatus === 'connected' || !remotePeerId.trim()}
          >
            Connect
          </button>
        </div>
      </div>

      {/* Graph */}
      <GraphProvider
        elements={elements}
        links={links}
        onElementsChange={handleElementsChange}
        onLinksChange={handleLinksChange}
      >
        <PaperApp onAddElement={handleAddElement} onRemoveLast={handleRemoveLast} />
      </GraphProvider>
    </div>
  );
}

/**
 * ============================================================================
 * USAGE SUMMARY
 * ============================================================================
 *
 * To use PeerJS collaborative mode:
 *
 * 1. Open this page in two browser windows/tabs
 * 2. Each window will get a unique peer ID
 * 3. Copy the ID from one window
 * 4. Paste it into the "Enter peer ID to connect" field in the other window
 * 5. Click "Connect"
 * 6. Now both peers are connected and will see each other's changes in real-time
 *
 * HOW IT WORKS:
 *
 * - Each peer creates a PeerJS connection with a unique ID
 * - When connected, state changes are sent via WebRTC data channels
 * - Received updates are applied to local React state
 * - GraphProvider syncs state changes to the JointJS graph
 *
 * Benefits:
 * - Real-time collaboration
 * - No server required (except PeerJS signaling server)
 * - Direct peer-to-peer communication
 * - Low latency
 *
 * ============================================================================
 */

export default function App() {
  return <Main />;
}
