import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null;

  return (
    <div className={`prose prose-sm max-w-none
      prose-headings:text-gray-900 prose-headings:font-semibold
      prose-p:text-gray-700 prose-p:leading-relaxed
      prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline
      prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
      prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:shadow-lg
      prose-blockquote:border-l-primary-500 prose-blockquote:text-gray-600 prose-blockquote:italic
      prose-ul:text-gray-700 prose-ol:text-gray-700
      prose-li:marker:text-gray-400
      prose-hr:border-gray-200
      ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
