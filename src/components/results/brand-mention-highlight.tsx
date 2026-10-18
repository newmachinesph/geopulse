interface BrandMentionHighlightProps {
  text: string;
  brandName: string;
}

export function BrandMentionHighlight({ text, brandName }: BrandMentionHighlightProps) {
  if (!brandName) return <span>{text}</span>;
  const escaped = brandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp("(" + escaped + ")", "gi");
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === brandName.toLowerCase()
          ? <mark key={i} className="bg-primary/30 text-primary px-0.5 rounded">{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </span>
  );
}
