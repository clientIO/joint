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
 * 3. **Controlled Mode**: We use React-controlled mode to manage state,
 *    and sync that state across peers using PeerJS.
 *
 * 4. **Connection Flow**:
 *    - Each peer gets a unique ID when they load the page
 *    - One peer can connect to another by entering their ID
 *    - Once connected, state changes are synchronized bidirectionally
 *
 * HOW IT WORKS:
 *
 * 1. Peer A loads page → Gets ID "abc123"
 * 2. Peer B loads page → Gets ID "xyz789"
 * 3. Peer A enters "xyz789" → Connects to Peer B
 * 4. Peer A adds element → State updates → Sent to Peer B via PeerJS
 * 5. Peer B receives update → Updates local state → Graph updates
 *
 * ============================================================================
 */

import {
  createElements,
  createLinks,
  GraphProvider,
  type GraphProps,
  type GraphElement,
  type GraphLink,
  type InferElement,
  Paper,
  type ExternalGraphStore,
} from '@joint/react';
import '../../examples/index.css';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { useState, useEffect, useRef } from 'react';
import Peer, { type DataConnection } from 'peerjs';
import type { GraphStoreSnapshot } from '../../../store/graph-store';
import type { Update } from '../../../utils/create-state';

// ============================================================================
// STEP 1: Define Initial Graph Data
// ============================================================================

const defaultElements = createElements([
  { id: '1', label: 'Hello', x: 100, y: 0, width: 100, height: 50 },
  { id: '2', label: 'World', x: 100, y: 200, width: 100, height: 50 },
]);

const defaultLinks = createLinks([
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    attrs: {
      line: {
        stroke: PRIMARY,
      },
    },
  },
]);

type CustomElement = InferElement<typeof defaultElements>;

// ============================================================================
// STEP 2: Custom Element Renderer
// ============================================================================

function RenderItem(props: CustomElement) {
  const { label, width, height } = props;
  return (
    <foreignObject width={width} height={height}>
      <div className="node">{label}</div>
    </foreignObject>
  );
}

// ============================================================================
// STEP 3: PeerJS External Store
// ============================================================================

/**
 * Message types for PeerJS communication.
 * We send structured messages to synchronize state between peers.
 */
interface StateSyncMessage {
  type: 'state-update';
  elements: GraphElement[];
  links: GraphLink[];
}

/**
 * Creates an ExternalGraphStore that syncs state via PeerJS.
 *
 * This store:
 * 1. Manages local state (elements and links)
 * 2. Sends state updates to connected peers when state changes
 * 3. Receives state updates from peers and updates local state
 * 4. Implements ExternalStoreLike interface for GraphProvider
 *
 * The key advantage: ALL state changes (including position changes from dragging)
 * are automatically captured and synced, because GraphProvider calls setState
 * on the external store for every change.
 */
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

function createPeerJSStore(
  initialElements: GraphElement[],
  initialLinks: GraphLink[]
): {
  store: ExternalGraphStore;
  peerId: string | null;
  connectedPeerId: string | null;
  connectionStatus: ConnectionStatus;
  connectToPeer: (remotePeerId: string) => void;
  setCallbacks: (
    peerIdCb: (id: string | null) => void,
    statusCb: (status: ConnectionStatus) => void,
    connectedIdCb: (id: string | null) => void
  ) => void;
} {
  // Local state
  let currentState: GraphStoreSnapshot = {
    elements: initialElements,
    links: initialLinks,
  };

  // Subscribers (for ExternalStoreLike interface)
  const subscribers = new Set<() => void>();

  // PeerJS connection management
  let peerId: string | null = null;
  let connectedPeerId: string | null = null;
  let connectionStatus: ConnectionStatus = 'disconnected';
  let peerRef: Peer | null = null;
  const connectionsRef: DataConnection[] = [];
  const isReceivingUpdateRef = { current: false };

  // Notify subscribers of state changes
  const notifySubscribers = () => {
    for (const subscriber of subscribers) {
      subscriber();
    }
  };

  // Send state update to all connected peers
  const sendStateUpdate = (state: GraphStoreSnapshot) => {
    // Don't send if we're currently receiving an update (prevent loops)
    if (isReceivingUpdateRef.current) {
      return;
    }

    const message: StateSyncMessage = {
      type: 'state-update',
      elements: state.elements,
      links: state.links,
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
      isReceivingUpdateRef.current = true;
      currentState = {
        elements: message.elements,
        links: message.links,
      };
      notifySubscribers();
      // Reset flag after a short delay
      setTimeout(() => {
        isReceivingUpdateRef.current = false;
      }, 100);
    }
  };

  // Create the external store
  const store: ExternalGraphStore = {
    getSnapshot: (): GraphStoreSnapshot => {
      return currentState;
    },

    subscribe: (listener: () => void) => {
      subscribers.add(listener);
      return () => {
        subscribers.delete(listener);
      };
    },

    setState: (updater: Update<GraphStoreSnapshot>) => {
      // Update local state
      const newState = typeof updater === 'function' ? updater(currentState) : updater;
      currentState = newState;

      // Notify subscribers
      notifySubscribers();

      // Send to peers (if connected and not receiving an update)
      if (connectionStatus === 'connected' && !isReceivingUpdateRef.current) {
        sendStateUpdate(newState);
      }
    },
  };

  // Callbacks for React state updates
  let onPeerIdChange: ((id: string | null) => void) | null = null;
  let onConnectionStatusChange: ((status: ConnectionStatus) => void) | null = null;
  let onConnectedPeerIdChange: ((id: string | null) => void) | null = null;

  // Initialize PeerJS peer
  const initializePeer = () => {
    const peer = new Peer();
    peerRef = peer;

    peer.on('open', (id) => {
      peerId = id;
      if (onPeerIdChange) {
        onPeerIdChange(id);
      }
    });

    // Handle incoming connections
    peer.on('connection', (conn) => {
      connectionStatus = 'connected';
      connectedPeerId = conn.peer;
      connectionsRef.push(conn);
      if (onConnectionStatusChange) {
        onConnectionStatusChange('connected');
      }
      if (onConnectedPeerIdChange) {
        onConnectedPeerIdChange(conn.peer);
      }

      // Handle incoming data
      conn.on('data', (data) => {
        handlePeerUpdate(data as StateSyncMessage);
      });

      // Handle connection close
      conn.on('close', () => {
        const index = connectionsRef.indexOf(conn);
        if (index !== -1) {
          connectionsRef.splice(index, 1);
        }
        if (connectionsRef.length === 0) {
          connectionStatus = 'disconnected';
          connectedPeerId = null;
          if (onConnectionStatusChange) {
            onConnectionStatusChange('disconnected');
          }
          if (onConnectedPeerIdChange) {
            onConnectedPeerIdChange(null);
          }
        }
      });
    });

    peer.on('error', (error) => {
      // eslint-disable-next-line no-console
      console.error('PeerJS error:', error);
      if (error.type === 'peer-unavailable') {
        connectionStatus = 'disconnected';
        if (onConnectionStatusChange) {
          onConnectionStatusChange('disconnected');
        }
        alert('Peer not found. Make sure the peer ID is correct and the peer is online.');
      }
    });
  };

  // Connect to another peer
  const connectToPeer = (remotePeerId: string) => {
    if (!peerRef) {
      return;
    }

    connectionStatus = 'connecting';
    if (onConnectionStatusChange) {
      onConnectionStatusChange('connecting');
    }

    const conn = peerRef.connect(remotePeerId);

    conn.on('open', () => {
      connectionStatus = 'connected';
      connectedPeerId = remotePeerId;
      connectionsRef.push(conn);
      if (onConnectionStatusChange) {
        onConnectionStatusChange('connected');
      }
      if (onConnectedPeerIdChange) {
        onConnectedPeerIdChange(remotePeerId);
      }

      // Send current state to the newly connected peer
      sendStateUpdate(currentState);
    });

    conn.on('data', (data) => {
      handlePeerUpdate(data as StateSyncMessage);
    });

    conn.on('close', () => {
      const index = connectionsRef.indexOf(conn);
      if (index !== -1) {
        connectionsRef.splice(index, 1);
      }
      if (connectionsRef.length === 0) {
        connectionStatus = 'disconnected';
        connectedPeerId = null;
        if (onConnectionStatusChange) {
          onConnectionStatusChange('disconnected');
        }
        if (onConnectedPeerIdChange) {
          onConnectedPeerIdChange(null);
        }
      }
    });

    conn.on('error', (error) => {
      // eslint-disable-next-line no-console
      console.error('Connection error:', error);
      connectionStatus = 'disconnected';
      if (onConnectionStatusChange) {
        onConnectionStatusChange('disconnected');
      }
    });
  };

  // Initialize peer
  initializePeer();

  return {
    store,
    get peerId() {
      return peerId;
    },
    get connectedPeerId() {
      return connectedPeerId;
    },
    get connectionStatus() {
      return connectionStatus;
    },
    connectToPeer,
    setCallbacks: (
      peerIdCb: (id: string | null) => void,
      statusCb: (status: ConnectionStatus) => void,
      connectedIdCb: (id: string | null) => void
    ) => {
      onPeerIdChange = peerIdCb;
      onConnectionStatusChange = statusCb;
      onConnectedPeerIdChange = connectedIdCb;
    },
  };
}

// ============================================================================
// STEP 4: Paper Component with Controls
// ============================================================================

interface PaperAppProps {
  readonly store: ExternalGraphStore;
}

function PaperApp({ store }: Readonly<PaperAppProps>) {
  return (
    <div className="flex flex-col gap-4">
      <Paper width="100%" className={PAPER_CLASSNAME} height={400} renderElement={RenderItem} />
      {/* Dark-themed controls matching the connection panel */}
      <div className="flex flex-wrap gap-2 justify-start p-4 bg-gray-800 rounded-lg border border-gray-700">
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
          onClick={() => {
            // Get current state from the store
            const currentState = store.getSnapshot();

            // Create a new element
            const newElement: CustomElement = {
              id: Math.random().toString(36).slice(7),
              label: 'New Node',
              x: Math.random() * 200,
              y: Math.random() * 200,
              width: 100,
              height: 50,
            } as CustomElement;

            // Update the store with the new element
            // This will automatically sync to peers via PeerJS
            store.setState({
              elements: [...currentState.elements, newElement],
              links: [...currentState.links],
            });
          }}
        >
          Add Element
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
          onClick={() => {
            // Get current state from the store
            const currentState = store.getSnapshot();

            if (currentState.elements.length === 0) {
              return;
            }

            // Remove the last element
            const newElements = currentState.elements.slice(0, -1);
            const removedElementId = currentState.elements.at(-1)?.id;

            // Remove links connected to the removed element
            const newLinks = removedElementId
              ? currentState.links.filter(
                  (link) => link.source !== removedElementId && link.target !== removedElementId
                )
              : currentState.links;

            // Update the store
            // This will automatically sync to peers via PeerJS
            store.setState({
              elements: newElements,
              links: [...newLinks],
            });
          }}
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

function Main(props: Readonly<GraphProps>) {
  const [remotePeerId, setRemotePeerId] = useState('');
  const [peerId, setPeerId] = useState<string | null>(null);
  const [connectedPeerId, setConnectedPeerId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Create PeerJS store (only once)
  const peerJSStoreRef = useRef(createPeerJSStore(defaultElements, defaultLinks));

  // Set up callbacks for React state updates
  useEffect(() => {
    peerJSStoreRef.current.setCallbacks(setPeerId, setConnectionStatus, setConnectedPeerId);
  }, []);

  const handleConnect = () => {
    if (remotePeerId.trim()) {
      peerJSStoreRef.current.connectToPeer(remotePeerId.trim());
      setConnectionStatus('connecting');
    }
  };

  const handleCopyId = async () => {
    if (peerId) {
      try {
        await navigator.clipboard.writeText(peerId);
        // Show feedback
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
      <GraphProvider {...props} externalStore={peerJSStoreRef.current.store}>
        <PaperApp store={peerJSStoreRef.current.store} />
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
 * - Received updates are applied to local state
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

export default function App(props: Readonly<GraphProps>) {
  return <Main {...props} />;
}
