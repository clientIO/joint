import { Diagram } from './diagram';

const BADGES = [
  'renderToString',
  'full SVG in HTML',
  'SEO-friendly',
  'hydrates to interactive',
];

/** The full page, rendered identically on the server and hydrated on the client. */
export function Page() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-8 px-6 py-12">
      <header className="flex flex-col items-center gap-4 text-center">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-widest text-slate-300">
          @joint/react · server-side rendering
        </span>
        <h1 className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
          The diagram is rendered on the server
        </h1>
        <p className="max-w-2xl text-balance text-slate-400">
          This whole graph — nodes, links, and each node&apos;s React content — is produced by{' '}
          <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-slate-200">renderToString</code> on the
          server. Disable JavaScript and reload: the diagram is still there, because it shipped as plain SVG in the HTML.
        </p>
        <ul className="flex flex-wrap justify-center gap-2">
          {BADGES.map((badge) => (
            <li
              key={badge}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
            >
              {badge}
            </li>
          ))}
        </ul>
      </header>

      <Diagram />

      <footer className="flex flex-col items-center gap-2 text-center text-sm text-slate-500">
        <p>
          <span className="font-semibold text-emerald-400">JavaScript on:</span> the live JointJS paper hydrates — drag
          nodes, it is fully interactive.
        </p>
        <noscript>
          <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-amber-200">
            JavaScript is disabled — this diagram was rendered entirely on the server.
          </p>
        </noscript>
      </footer>
    </main>
  );
}
