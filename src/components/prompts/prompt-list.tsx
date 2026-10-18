import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge } from "@/components/ui";
import type { Prompt } from "@/lib/types";
import { getScoreVariant } from "@/lib/utils";
import { INTENT_CATEGORIES } from "@/lib/constants";

interface PromptListProps {
  prompts: Prompt[];
  onSelect: (id: string) => void;
}

export function PromptList({ prompts, onSelect }: PromptListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Prompt</TableHead>
          <TableHead>Intent</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Avg Score</TableHead>
          <TableHead>Runs</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {prompts.map((p) => {
          const intent = INTENT_CATEGORIES.find((c) => c.value === p.intentCategory);
          return (
            <TableRow key={p.id} className="cursor-pointer" onClick={() => onSelect(p.id)}>
              <TableCell className="max-w-xs truncate font-medium">{p.text}</TableCell>
              <TableCell><Badge variant="secondary">{intent?.label ?? p.intentCategory}</Badge></TableCell>
              <TableCell><Badge variant={p.status === "active" ? "default" : "outline"}>{p.status}</Badge></TableCell>
              <TableCell><Badge variant={getScoreVariant(p.avgScore)}>{p.avgScore.toFixed(1)}</Badge></TableCell>
              <TableCell className="text-muted-foreground">{p.runCount}</TableCell>
            </TableRow>
          );
        })}
        {prompts.length === 0 && (
          <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No prompts yet</TableCell></TableRow>
        )}
      </TableBody>
    </Table>
  );
}
