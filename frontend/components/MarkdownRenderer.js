import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const components = {
  h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-4" style={{ fontSize: '18px' }}>{children}</h1>,
  h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-4" style={{ fontSize: '16px' }}>{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-bold mb-2 mt-3" style={{ fontSize: '14px' }}>{children}</h3>,
  h4: ({ children }) => <h4 className="text-xs font-bold mb-1 mt-3" style={{ fontSize: '12px' }}>{children}</h4>,
  h5: ({ children }) => <h5 className="text-xs font-bold mb-1 mt-2" style={{ fontSize: '11px' }}>{children}</h5>,
  h6: ({ children }) => <h6 className="text-xs font-bold mb-1 mt-2" style={{ fontSize: '10px' }}>{children}</h6>,
  p: ({ children }) => <p className="text-sm mb-3 leading-relaxed" style={{ fontSize: '13px' }}>{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-3 text-sm" style={{ fontSize: '13px' }}>{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 text-sm" style={{ fontSize: '13px' }}>{children}</ol>,
  li: ({ children }) => <li className="mb-1" style={{ fontSize: '13px' }}>{children}</li>,
  blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-4 italic text-sm mb-3 text-[var(--color-text-secondary)]" style={{ fontSize: '13px' }}>{children}</blockquote>,
  code: ({ inline, children }) => inline ? <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono" style={{ fontSize: '13px' }}>{children}</code> : <code className="block bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap" style={{ fontSize: '13px' }}>{children}</code>,
  pre: ({ children }) => <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-3 overflow-x-auto" style={{ fontSize: '13px' }}>{children}</pre>,
  a: ({ href, children }) => <a href={href} className="text-primary-600 hover:text-primary-700 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  hr: () => <hr className="border-[var(--color-border)] my-4" />,
  table: ({ children }) => <table className="w-full border-collapse mb-3 text-sm" style={{ fontSize: '13px' }}>{children}</table>,
  th: ({ children }) => <th className="border border-[var(--color-border)] px-3 py-2 text-left font-semibold bg-gray-50 dark:bg-gray-800">{children}</th>,
  td: ({ children }) => <td className="border border-[var(--color-border)] px-3 py-2">{children}</td>,
};

export default function MarkdownRenderer({ content, className = '' }) {
  return (
    <div className={`text-[var(--color-text)] ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}