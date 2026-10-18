import { IconFileText, IconLink, IconSearch, IconSwords, IconHeart } from "@tabler/icons-react";

const icons: Record<string, typeof IconFileText> = {
  content_gap: IconFileText,
  citation_fix: IconLink,
  entity_optimization: IconSearch,
  competitor_response: IconSwords,
  sentiment_repair: IconHeart,
};

export function ActionTypeIcon({ type }: { type: string }) {
  const Icon = icons[type] ?? IconFileText;
  return <Icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />;
}
