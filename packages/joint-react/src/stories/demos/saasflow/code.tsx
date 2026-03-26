 
 
 
 
 
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import {
  GraphProvider,
  Paper,
  useGraph,
  useMarkup,
  useMeasureNode,
  useFlatElementData,
  useFlatLinkData,
  type FlatElementData,
  type FlatLinkData,
  type RenderElement,
} from '@joint/react';

import type { dia } from '@joint/core';
import { createContext, useCallback, useContext, useRef, useState } from 'react';

// ── Theme ───────────────────────────────────────────────────────────────────

const ThemeContext = createContext(false);

const DARK = {
  canvas: '#151515',
  card: '#1c1c1c',
  cardBorder: 'rgba(255,255,255,0.06)',
  text: '#e8e4df',
  sub: 'rgba(232,228,223,0.45)',
  accent: '#c8a44e',
  accentSoft: 'rgba(200,164,78,0.15)',
  link: '#c8a44e',
  badge: '#2a2a2a',
  badgeBorder: 'rgba(255,255,255,0.08)',
  port: '#c8a44e',
  portFill: '#151515',
  toolbar: '#1c1c1c',
  toolbarBorder: 'rgba(255,255,255,0.08)',
  toolbarText: 'rgba(232,228,223,0.6)',
  toolbarHover: 'rgba(255,255,255,0.06)',
} as const;

const LIGHT = {
  canvas: '#f4f1ec',
  card: '#ffffff',
  cardBorder: 'rgba(0,0,0,0.06)',
  text: '#1a1a1a',
  sub: 'rgba(26,26,26,0.5)',
  accent: '#b8912e',
  accentSoft: 'rgba(184,145,46,0.1)',
  link: '#b8912e',
  badge: '#f0ece4',
  badgeBorder: 'rgba(0,0,0,0.06)',
  port: '#b8912e',
  portFill: '#ffffff',
  toolbar: '#ffffff',
  toolbarBorder: 'rgba(0,0,0,0.08)',
  toolbarText: 'rgba(26,26,26,0.5)',
  toolbarHover: 'rgba(0,0,0,0.04)',
} as const;

function useTheme() {
  const isDark = useContext(ThemeContext);
  return isDark ? DARK : LIGHT;
}

// ── Data ────────────────────────────────────────────────────────────────────

type SaasNodeData = {
  readonly title: string;
  readonly subtitle: string;
  readonly icon: string;
  readonly status?: 'active' | 'pending' | 'done';
  readonly tags?: readonly string[];
  readonly progress?: number;
};

type SaasNode = FlatElementData<SaasNodeData>;

const PORT_R = 5;

const initialElements: Record<string, SaasNode> = {
  client: {
    data: {
      title: 'Client: SaaSflow',
      subtitle: 'Onboarded: 25 Jun',
      icon: 'fas fa-bolt',
      status: 'active',
      tags: ['Enterprise'],
    },
    x: 200,
    y: 20,
  },
  pm: {
    data: {
      title: 'Project Manager',
      subtitle: 'Managing progress',
      icon: 'fas fa-user-tie',
      status: 'active',
      tags: ['Lead', 'Slack', 'Gmail'],
      progress: 76,
    },
    x: 20,
    y: 250,
  },
  designer: {
    data: {
      title: 'UX Designer',
      subtitle: 'Designing interfaces',
      icon: 'fas fa-paint-brush',
      status: 'pending',
      tags: ['Figma', 'Notion'],
      progress: 44,
    },
    x: 380,
    y: 460,
  },
};

const initialLinks: Record<string, FlatLinkData> = {
  'client-pm': {
    source: 'client',
    sourcePort: 'out',
    target: 'pm',
    targetPort: 'in',
    width: 2,
    connector: { name: 'straight', args: { cornerType: 'cubic', cornerPreserveAspectRatio: true } },
    targetMarker: 'none',
    labels: {
      assigns: {
        text: 'Assigns',
        fontSize: 10,
        backgroundBorderRadius: 10,
        backgroundPadding: { x: 8, y: 4 },
      },
    },
  },
  'pm-designer': {
    source: 'pm',
    sourcePort: 'out',
    target: 'designer',
    targetPort: 'in',
    width: 2,
    connector: { name: 'straight', args: { cornerType: 'cubic', cornerPreserveAspectRatio: true } },
    dasharray: '6,4',
    targetMarker: {
      d: 'M 0 -4 L 8 0 L 0 4 Z',
      fill: 'context-stroke',
      stroke: 'none',
    },
    labels: {
      delegates: {
        text: 'Delegates',
        fontSize: 10,
        backgroundBorderRadius: 10,
        backgroundPadding: { x: 8, y: 4 },
      },
    },
  },
};

// ── Node Component ──────────────────────────────────────────────────────────

function StatusDot({ status }: Readonly<{ status?: string }>) {
  const colorMap: Record<string, string> = {
    active: '#34d399',
    pending: '#fbbf24',
    done: '#6b7280',
  };
  const color = colorMap[status ?? ''] ?? colorMap.done;
  return (
    <span
      className="inline-block w-2 h-2 rounded-full mr-1.5"
      style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
    />
  );
}

function ProgressBar({
  value,
  theme,
}: Readonly<{ value: number; theme: typeof DARK | typeof LIGHT }>) {
  return (
    <div className="w-full h-1.5 rounded-full mt-2" style={{ backgroundColor: theme.accentSoft }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${value}%`, backgroundColor: theme.accent }}
      />
    </div>
  );
}

function RenderSaasNode({ title, subtitle, icon, status, tags, progress }: Readonly<SaasNodeData>) {
  const contentRef = useRef<HTMLDivElement>(null);
  const { width, height } = useMeasureNode(contentRef);
  const theme = useTheme();
  const { selectorRef } = useMarkup();
  const isDark = theme === DARK;

  return (
    <>
      <foreignObject width={width} height={height} overflow="visible">
        <div
          ref={contentRef}
          className="rounded-2xl px-5 py-4 select-none"
          style={{
            width: 260,
            cursor: 'grab',
            backgroundColor: theme.card,
            border: `1px solid ${theme.cardBorder}`,
            boxShadow: `0 8px 32px rgba(0,0,0,${isDark ? 0.4 : 0.08})`,
            transition: 'transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease',
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0"
              style={{
                backgroundColor: theme.accentSoft,
                color: theme.accent,
                transition: 'all 150ms ease',
              }}
            >
              <i className={icon} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <StatusDot status={status} />
                <span className="text-sm font-semibold truncate" style={{ color: theme.text }}>
                  {title}
                </span>
              </div>
              <span className="text-xs block mt-0.5" style={{ color: theme.sub }}>
                {subtitle}
              </span>
            </div>
          </div>

          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-medium px-2.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: theme.badge,
                    border: `1px solid ${theme.badgeBorder}`,
                    color: theme.accent,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {progress !== undefined && (
            <div className="mt-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px]" style={{ color: theme.sub }}>
                  Progress
                </span>
                <span className="text-[10px] font-semibold" style={{ color: theme.accent }}>
                  {progress}%
                </span>
              </div>
              <ProgressBar value={progress} theme={theme} />
            </div>
          )}
        </div>
      </foreignObject>

      {/* Output port — bottom center */}
      <circle
        ref={selectorRef('out')}
        magnet="active"
        cursor="crosshair"
        cx={width / 2}
        cy={height}
        r={PORT_R}
        fill={theme.port}
        stroke={theme.card}
        strokeWidth={2}
      />
      {/* Input port — top center */}
      <circle
        ref={selectorRef('in')}
        magnet="passive"
        cx={width / 2}
        cy={0}
        r={PORT_R}
        fill={theme.portFill}
        stroke={theme.port}
        strokeWidth={2}
      />
    </>
  );
}

// ── Toolbar ─────────────────────────────────────────────────────────────────

function ToolbarButton({
  children,
  accent,
  onClick,
}: Readonly<{ children: React.ReactNode; accent?: boolean; onClick?: () => void }>) {
  const theme = useTheme();
  return (
    <button
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors duration-150 cursor-pointer border-0"
      style={
        accent
          ? { backgroundColor: theme.accent, color: theme === DARK ? '#151515' : '#ffffff' }
          : { color: theme.toolbarText, backgroundColor: 'transparent' }
      }
      onMouseEnter={(event) => {
        if (!accent) event.currentTarget.style.backgroundColor = theme.toolbarHover;
      }}
      onMouseLeave={(event) => {
        if (!accent) event.currentTarget.style.backgroundColor = 'transparent';
      }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Toolbar({ paperRef }: Readonly<{ paperRef: React.RefObject<dia.Paper | null> }>) {
  const theme = useTheme();
  const { setElement } = useGraph();

  const addNode = useCallback(() => {
    const id = `node-${Date.now()}`;
    const names = ['Developer', 'QA Engineer', 'DevOps', 'Analyst', 'Scrum Master'];
    const icons = [
      'fas fa-code',
      'fas fa-bug',
      'fas fa-server',
      'fas fa-chart-bar',
      'fas fa-tasks',
    ];
    const pick = Math.floor(Math.random() * names.length); // eslint-disable-line sonarjs/pseudo-random
    setElement(id, {
      data: {
        title: names[pick],
        subtitle: 'New team member',
        icon: icons[pick],
        status: 'pending',
        tags: ['New'],
      },
      x: 150 + Math.random() * 200, // eslint-disable-line sonarjs/pseudo-random
      y: 200 + Math.random() * 200, // eslint-disable-line sonarjs/pseudo-random
    } satisfies SaasNode);
  }, [setElement]);

  const onFit = useCallback(() => {
    paperRef.current?.transformToFitContent({
      padding: { top: 40, bottom: 80, left: 40, right: 40 },
      useModelGeometry: true,
      verticalAlign: 'middle',
      horizontalAlign: 'middle',
    });
  }, [paperRef]);

  const onZoomIn = useCallback(() => {
    const paper = paperRef.current;
    if (!paper) return;
    const { sx } = paper.scale();
    paper.scale(sx * 1.2, sx * 1.2);
  }, [paperRef]);

  const onZoomOut = useCallback(() => {
    const paper = paperRef.current;
    if (!paper) return;
    const { sx } = paper.scale();
    paper.scale(sx / 1.2, sx / 1.2);
  }, [paperRef]);

  return (
    <div
      className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-2 py-2 rounded-2xl"
      style={{
        backgroundColor: theme.toolbar,
        border: `1px solid ${theme.toolbarBorder}`,
        boxShadow: `0 8px 32px rgba(0,0,0,${theme === DARK ? 0.5 : 0.1})`,
      }}
    >
      <ToolbarButton accent onClick={addNode}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Node
      </ToolbarButton>

      <div style={{ width: 1, height: 20, backgroundColor: theme.toolbarBorder }} />

      <ToolbarButton onClick={onFit}>
        <svg
          width="14"
          height="14"
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
      </ToolbarButton>

      <div style={{ width: 1, height: 20, backgroundColor: theme.toolbarBorder }} />

      <ToolbarButton onClick={onZoomIn}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="11" y1="8" x2="11" y2="14" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </ToolbarButton>

      <ToolbarButton onClick={onZoomOut}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </ToolbarButton>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────

const PAPER_ID = 'saasflow-paper';

function Main() {
  const isDark = useContext(ThemeContext);
  const theme = isDark ? DARK : LIGHT;
  const paperRef = useRef<dia.Paper | null>(null);

  const elementDefaults = useFlatElementData({
    defaults: () => ({
      ports: {
        out: {
          cx: 'calc(0.5 * w)',
          cy: 'calc(h)',
          width: PORT_R * 2,
          height: PORT_R * 2,
          color: theme.port,
          outline: theme.canvas,
          outlineWidth: 2,
        },
        in: {
          cx: 'calc(0.5 * w)',
          cy: 0,
          width: PORT_R * 2,
          height: PORT_R * 2,
          color: theme.port,
          outline: theme.canvas,
          outlineWidth: 2,
          passive: true,
        },
      },
    }),
  }, [theme]);

  const linkDefaults = useFlatLinkData({
    defaults: {
      color: theme.link,
      labelStyle: {
        color: theme.sub,
        backgroundColor: theme.canvas,
        backgroundOutline: theme.cardBorder,
      },
    },
  }, [theme]);

  return (
    <GraphProvider
      elements={initialElements}
      links={initialLinks}
      {...elementDefaults}
      {...linkDefaults}
    >
      <Paper
        ref={paperRef}
        id={PAPER_ID}
        height="100%"
        width="100%"

        gridSize={5}
        overflow
        linkPinning={false}
        snapLinks={{ radius: 30 }}
        magnetThreshold="onleave"
        clickThreshold={10}
        defaultRouter={{ name: 'rightAngle', args: { margin: 20 } }}
        defaultConnector={{
          name: 'straight',
          args: { cornerType: 'cubic', cornerPreserveAspectRatio: true },
        }}
        defaultConnectionPoint={{ name: 'boundary', args: { offset: 8, extrapolate: true } }}
        defaultLink={{ color: theme.link, width: 2, targetMarker: 'none' }}
        validateMagnet={(_cellView, magnet) => magnet.getAttribute('magnet') !== 'passive'}
        validateConnection={(cellViewS, _magnetS, cellViewT, magnetT) => {
          if (cellViewS === cellViewT) return false;
          return magnetT?.getAttribute('magnet') === 'passive';
        }}
        interactive={(cellView) => (cellView.model.isLink() ? false : { linkMove: false })}
        renderElement={RenderSaasNode as RenderElement<SaasNodeData>}
      />
      <Toolbar paperRef={paperRef} />
    </GraphProvider>
  );
}

// ── Theme Switch ────────────────────────────────────────────────────────────

function ThemeSwitch({ isDark, onClick }: Readonly<{ isDark: boolean; onClick: () => void }>) {
  return (
    <button
      onClick={onClick}
      title="Toggle theme"
      className="absolute top-5 right-5 z-10 w-[56px] h-[28px] rounded-full cursor-pointer border-0 transition-colors duration-300"
      style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke={isDark ? '#e8e4df' : '#b8912e'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute top-[7px] left-[7px]"
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
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill={isDark ? 'rgba(255,255,255,0.25)' : '#1a1a1a'}
        className="absolute top-[7px] right-[7px]"
      >
        <path d="M12.0557 3.59974C12.2752 3.2813 12.2913 2.86484 12.0972 2.53033C11.9031 2.19582 11.5335 2.00324 11.1481 2.03579C6.02351 2.46868 2 6.76392 2 12C2 17.5228 6.47715 22 12 22C17.236 22 21.5313 17.9764 21.9642 12.8518C21.9967 12.4664 21.8041 12.0968 21.4696 11.9027C21.1351 11.7086 20.7187 11.7248 20.4002 11.9443C19.4341 12.6102 18.2641 13 17 13C13.6863 13 11 10.3137 11 6.99996C11 5.73589 11.3898 4.56587 12.0557 3.59974Z" />
      </svg>
      <div
        className="w-[22px] h-[22px] rounded-full absolute top-[3px] transition-transform duration-500 ease-in-out"
        style={{
          transform: isDark ? 'translateX(30px)' : 'translateX(3px)',
          backgroundColor: isDark ? '#e8e4df' : '#ffffff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
        }}
      />
    </button>
  );
}

// ── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const theme = isDark ? DARK : LIGHT;

  return (
    <ThemeContext.Provider value={isDark}>
      <div
        className="relative w-full h-[720px] rounded-xl overflow-hidden transition-colors duration-500"
        style={{ backgroundColor: theme.canvas, border: `1px solid ${theme.cardBorder}` }}
      >
        <Main />
        <ThemeSwitch isDark={isDark} onClick={() => setIsDark((v) => !v)} />
      </div>
    </ThemeContext.Provider>
  );
}
