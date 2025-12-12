interface Props {
  content: string
}

export const HtmlRenderer= ({ content }: Props) => (
  <div dangerouslySetInnerHTML={{ __html: content }} />
)