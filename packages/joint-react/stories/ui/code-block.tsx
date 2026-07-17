import { useCallback, useId, useState, type MouseEvent } from 'react';
import { Highlight, type PrismTheme } from 'prism-react-renderer';
import { cn } from './cn';

export interface CodeFile {
  readonly name: string;
  readonly code: string;
}

export interface CodeBlockProps {
  /** Single source snippet. Ignored when `files` is provided. */
  readonly code?: string;
  /** Multiple named snippets, rendered as tabs. */
  readonly files?: readonly CodeFile[];
  /** Name shown for a single snippet. Default `example.tsx`. */
  readonly filename?: string;
  /** Start expanded. Default collapsed. */
  readonly defaultOpen?: boolean;
}

/** Dark syntax theme tuned to the JointJS palette (navy base, warm accents). */
const PRISM_THEME: PrismTheme = {
  plain: { color: '#dde6ed', backgroundColor: 'transparent' },
  styles: [
    { types: ['comment', 'prolog', 'doctype', 'cdata'], style: { color: '#5c6f7e', fontStyle: 'italic' } },
    { types: ['punctuation'], style: { color: '#8697a6' } },
    { types: ['property', 'tag', 'constant', 'symbol', 'deleted'], style: { color: '#ff8a95' } },
    { types: ['boolean', 'number'], style: { color: '#ffb270' } },
    { types: ['attr-name', 'string', 'char', 'builtin', 'inserted'], style: { color: '#8fd3b6' } },
    { types: ['operator', 'entity', 'url'], style: { color: '#a9bccd' } },
    { types: ['atrule', 'attr-value', 'keyword'], style: { color: '#ff9505' } },
    { types: ['function', 'class-name'], style: { color: '#78b6ff' } },
    { types: ['regex', 'important', 'variable'], style: { color: '#ffb270' } },
  ],
};

function ChevronIcon({ open }: Readonly<{ open: boolean }>) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="13"
      height="13"
      aria-hidden
      className={cn('transition-transform duration-200 ease-[--ease-out-quint]', open && 'rotate-90')}
    >
      <path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CodeButton({ onClick, children }: Readonly<{
  onClick: () => void;
  children: React.ReactNode;
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-[7px] px-2 py-1 text-[12px] font-medium text-ink-muted transition-colors',
        'hover:bg-surface-2 hover:text-ink',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/55'
      )}
    >
      {children}
    </button>
  );
}

/**
 * Collapsible, copyable, syntax-highlighted source viewer. Self-contained so a
 * story stays a portable unit (works embedded in Storybook or Docusaurus).
 * @group Storybook UI
 */
export function CodeBlock({
  code,
  files,
  filename = 'example.tsx',
  defaultOpen = false,
}: Readonly<CodeBlockProps>) {
  const list: readonly CodeFile[] = files ?? [{ name: filename, code: code ?? '' }];
  const [open, setOpen] = useState(defaultOpen);
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const regionId = useId();
  const current = list[Math.min(active, list.length - 1)];

  const toggle = useCallback(() => setOpen((value) => !value), []);
  const selectTab = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => setActive(Number(event.currentTarget.dataset.index)),
    []
  );

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(current?.code ?? '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard blocked (permissions/insecure context) — nothing to recover.
    }
  }, [current]);

  return (
    <div className="overflow-hidden rounded-[--radius-control] border border-hairline bg-[#0a1219]">
      <div className="flex items-center gap-2 border-b border-hairline/70 px-1.5 py-1.5">
        <CodeButton onClick={toggle}>
          <span className="inline-flex items-center gap-1.5">
            <ChevronIcon open={open} />
            {open ? 'Hide code' : 'Show code'}
          </span>
        </CodeButton>

        {open && list.length > 1 && (
          <div className="flex items-center gap-1 overflow-x-auto">
            {list.map((file, index) => (
              <button
                key={file.name}
                type="button"
                data-index={index}
                onClick={selectTab}
                className={cn(
                  'rounded-[7px] px-2 py-1 text-[12px] font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/55',
                  index === active ? 'bg-surface-2 text-ink' : 'text-ink-muted hover:bg-surface-2 hover:text-ink'
                )}
              >
                {file.name}
              </button>
            ))}
          </div>
        )}

        <div className="ml-auto flex items-center gap-2 pr-1">
          {open && list.length === 1 && (
            <span className="hidden font-mono text-[11px] text-ink-faint sm:inline">{current?.name}</span>
          )}
          {open && (
            <button
              type="button"
              onClick={copy}
              className="rounded-[7px] px-2 py-1 text-[12px] font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/55"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>
      </div>

      <div id={regionId} className="jj-collapse" data-open={open}>
        <div>
          <Highlight theme={PRISM_THEME} code={(current?.code ?? '').replace(/\n$/, '')} language="tsx">
            {({ style, tokens, getLineProps, getTokenProps }) => (
              <pre
                className="max-h-[460px] overflow-auto px-1 py-3.5 font-mono text-[12.5px] leading-[1.65]"
                style={style}
              >
                {tokens.map((line, index) => {
                  const lineProps = getLineProps({ line });
                  return (
                    <div key={index} {...lineProps} className={cn(lineProps.className, 'px-3')}>
                      <span className="mr-4 inline-block w-6 select-none text-right text-ink-faint/60">
                        {index + 1}
                      </span>
                      {line.map((token, key) => {
                        const tokenProps = getTokenProps({ token });
                        return <span key={key} {...tokenProps} />;
                      })}
                    </div>
                  );
                })}
              </pre>
            )}
          </Highlight>
        </div>
      </div>
    </div>
  );
}
