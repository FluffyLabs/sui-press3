import ReactMarkdown from 'react-markdown'

interface Props {
  content: string;
}

export const MarkdownRenderer = ({ content }: Props) => (
  <div className="markdown-content">
    <ReactMarkdown>{content}</ReactMarkdown>
  </div>
)