import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Link } from 'react-router-dom'
import { resolveRef } from '@lib/resolveRef'
import { cn } from '@lib/utils'

interface Props {
  content: string
  className?: string
}

export function RuleContent({ content, className }: Props) {
  return (
    <div className={cn('text-sm text-[var(--foreground)]', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Intercept links: href="#id" → React Router Link; otherwise plain <a>
          a({ href, children }) {
            if (href?.startsWith('#')) {
              const id = href.slice(1)
              const ref = resolveRef(id)
              if (ref) {
                return (
                  <Link
                    to={ref.url}
                    className="text-[var(--primary)] underline underline-offset-2 hover:opacity-80 transition-opacity"
                  >
                    {children}
                  </Link>
                )
              }
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--primary)] underline underline-offset-2"
              >
                {children}
              </a>
            )
          },

          p({ children }) {
            return <p className="mb-2 leading-relaxed">{children}</p>
          },

          ul({ children }) {
            return <ul className="list-disc list-outside pl-5 mb-2 space-y-0.5">{children}</ul>
          },

          ol({ children }) {
            return <ol className="list-decimal list-outside pl-5 mb-2 space-y-0.5">{children}</ol>
          },

          li({ children }) {
            return <li className="leading-relaxed">{children}</li>
          },

          strong({ children }) {
            return (
              <strong className="font-semibold text-[var(--foreground)]">{children}</strong>
            )
          },

          h3({ children }) {
            return (
              <h3 className="text-base font-bold mt-4 mb-1 text-[var(--foreground)]">
                {children}
              </h3>
            )
          },

          h4({ children }) {
            return (
              <h4 className="text-sm font-bold mt-3 mb-1 text-[var(--foreground)]">
                {children}
              </h4>
            )
          },

          // GFM table
          table({ children }) {
            return (
              <div className="overflow-x-auto my-3 rounded-lg border border-[var(--border)]">
                <table className="w-full text-sm border-collapse">{children}</table>
              </div>
            )
          },

          thead({ children }) {
            return (
              <thead className="bg-[var(--secondary)] text-[var(--secondary-foreground)]">
                {children}
              </thead>
            )
          },

          tbody({ children }) {
            return <tbody>{children}</tbody>
          },

          tr({ children }) {
            return (
              <tr className="border-t border-[var(--border)] hover:bg-[var(--accent)]/40 transition-colors">
                {children}
              </tr>
            )
          },

          th({ children }) {
            return (
              <th className="px-3 py-2 text-left font-semibold whitespace-nowrap border-r border-[var(--border)] last:border-r-0">
                {children}
              </th>
            )
          },

          td({ children }) {
            return (
              <td className="px-3 py-1.5 align-top border-r border-[var(--border)] last:border-r-0">
                {children}
              </td>
            )
          },

          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-[var(--border)] pl-4 italic text-[var(--muted-foreground)] my-2">
                {children}
              </blockquote>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
