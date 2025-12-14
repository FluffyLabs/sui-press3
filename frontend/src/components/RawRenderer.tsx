interface Props {
  content: string;
}

export const RawRenderer = ({ content }: Props) => {
  return <pre>{content}</pre>;
};
