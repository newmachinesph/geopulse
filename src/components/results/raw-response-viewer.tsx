import { ScrollArea } from "@/components/ui";
import ReactMarkdown from "react-markdown";

interface RawResponseViewerProps {
  rawText: string;
  brandName?: string;
}

export function RawResponseViewer({ rawText, brandName }: RawResponseViewerProps) {
  let highlighted = rawText;
  if (brandName) {
    const escaped = brandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp("(" + escaped + ")", "gi");
    highlighted = rawText.replace(regex, "**$1**");
  }

  return (
    <ScrollArea className="h-96 rounded-lg border border-border p-4">
      <div className="prose prose-invert prose-sm max-w-none">
        <ReactMarkdown>{highlighted}</ReactMarkdown>
      </div>
    </ScrollArea>
  );
}
