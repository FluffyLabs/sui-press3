
interface Props {
  content: string
}

export const MarkdownRenderer = ({ content }: Props) => (
  <pre>{content}</pre> 
)