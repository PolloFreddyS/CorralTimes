import { Info, Megaphone, CircleHelp } from 'lucide-react';
import type { ReactNode } from 'react';
import { RumorLabel } from '@/components/editorial';
import { safeHref, type ArticleDoc, type Block, type TextNode } from '@shared/domain/article-doc';

/**
 * Renderizador CERRADO del documento de artículo. Solo conoce los nodos del esquema;
 * cualquier otra cosa se ignora. Todo el texto se renderiza como texto (React escapa).
 * Los enlaces pasan por safeHref (sin javascript:, data:, etc.).
 */
function Inline({ nodes }: { nodes: TextNode[] }) {
  return (
    <>
      {nodes.map((n, i) => {
        let el: ReactNode = n.text;
        for (const m of n.marks ?? []) {
          if (m.type === 'bold') el = <strong>{el}</strong>;
          else if (m.type === 'italic') el = <em>{el}</em>;
          else if (m.type === 'link') {
            const href = safeHref(m.attrs.href);
            el = href ? <a href={href} rel="noopener noreferrer nofollow" target="_blank">{el}</a> : el;
          }
        }
        return <span key={i}>{el}</span>;
      })}
    </>
  );
}

const CALLOUT = {
  info: { Icon: Info, className: 'border-green' },
  breaking: { Icon: Megaphone, className: 'border-accent' },
  rumor: { Icon: CircleHelp, className: 'border-accent border-dashed' },
} as const;

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'paragraph':
      return <p><Inline nodes={block.content} /></p>;
    case 'heading':
      return block.attrs.level === 2 ? (
        <h2 className="headline !mt-8 text-2xl sm:text-3xl"><Inline nodes={block.content} /></h2>
      ) : (
        <h3 className="!mt-6 font-headline text-xl font-bold"><Inline nodes={block.content} /></h3>
      );
    case 'quote':
      return (
        <figure className="!my-7 border-y-2 border-rule py-4">
          <blockquote className="font-headline text-2xl leading-snug italic">“{block.attrs.text}”</blockquote>
          <figcaption className="mt-2 font-sans text-xs tracking-wide uppercase text-fg-muted">— {block.attrs.attribution} · texto exacto</figcaption>
        </figure>
      );
    case 'callout': {
      const { Icon, className } = CALLOUT[block.attrs.tone];
      return (
        <aside className={`border-l-4 bg-surface-raised p-3 font-sans text-sm ${className}`}>
          <p className="flex items-center gap-1.5 font-bold"><Icon aria-hidden className="size-4" />{block.attrs.title}{block.attrs.tone === 'rumor' && <RumorLabel className="ml-2" />}</p>
          <p className="mt-1"><Inline nodes={block.content} /></p>
        </aside>
      );
    }
    case 'bulletList':
      return <ul className="list-disc space-y-1 pl-6">{block.content.map((item, i) => <li key={i}><Inline nodes={item} /></li>)}</ul>;
    case 'table':
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-sans text-sm">
            {block.attrs.caption && <caption className="kicker mb-1 text-left text-fg-muted">{block.attrs.caption}</caption>}
            <thead><tr className="border-b-2 border-rule">{block.header.map((h, i) => <th key={i} scope="col" className="py-1.5 pr-3 text-left">{h}</th>)}</tr></thead>
            <tbody>{block.rows.map((r, i) => <tr key={i} className="border-b border-rule-soft">{r.map((c, j) => <td key={j} className="py-1.5 pr-3">{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
    case 'image':
      // Las imágenes inline se resuelven desde la biblioteca de medios aprobada (Fase 6).
      return null;
    default:
      return null;
  }
}

export function ArticleBody({ doc }: { doc: ArticleDoc }) {
  return <div className="article-prose">{doc.content.map((b, i) => <BlockView key={i} block={b} />)}</div>;
}
