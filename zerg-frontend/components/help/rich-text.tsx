import { Fragment } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Formato simple que escribe el admin: párrafos separados por una línea en blanco, listas con "- ",
// **negrita** y [enlaces](https://…). Se arma con elementos de React (nunca HTML del usuario).
const INLINE = /\*\*(.+?)\*\*|\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s)]+)\)/g;

function Inline({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      parts.push(<strong key={m.index} className="font-semibold text-foreground">{m[1]}</strong>);
    } else {
      const href = m[3];
      const className = "font-medium text-brand-strong underline underline-offset-2 hover:no-underline";
      parts.push(
        href.startsWith("/") ? (
          <Link key={m.index} href={href} className={className}>{m[2]}</Link>
        ) : (
          <a key={m.index} href={href} target="_blank" rel="noreferrer" className={className}>{m[2]}</a>
        )
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

const BULLET = /^\s*[-•]\s+/;

// Agrupa las líneas seguidas: las que empiezan con "- " forman una lista; el resto, un párrafo.
function segments(text: string) {
  const out: { list: boolean; lines: string[] }[] = [];
  for (const block of text.split(/\n\s*\n/)) {
    let current: { list: boolean; lines: string[] } | null = null;
    for (const line of block.split("\n")) {
      if (!line.trim()) continue;
      const list = BULLET.test(line);
      if (!current || current.list !== list) out.push((current = { list, lines: [] }));
      current.lines.push(list ? line.replace(BULLET, "") : line);
    }
  }
  return out;
}

export function RichText({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn("space-y-3 leading-relaxed text-muted-foreground", className)}>
      {segments(text).map((seg, i) =>
        seg.list ? (
          <ul key={i} className="space-y-1.5 pl-1">
            {seg.lines.map((l, j) => (
              <li key={j} className="flex gap-2.5">
                <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand" />
                <span>
                  <Inline text={l} />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p key={i}>
            {seg.lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                <Inline text={l} />
              </Fragment>
            ))}
          </p>
        )
      )}
    </div>
  );
}
