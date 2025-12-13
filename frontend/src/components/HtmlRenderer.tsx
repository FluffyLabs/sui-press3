interface Props {
  content: string;
}

export const HtmlRenderer = ({ content }: Props) => (
  // biome-ignore lint/security/noDangerouslySetInnerHtml: intentional HTML rendering
  <div dangerouslySetInnerHTML={{ __html: content }} />
);
