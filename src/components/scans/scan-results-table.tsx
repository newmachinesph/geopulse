import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge, Button } from "@/components/ui";
import type { ParsedResult } from "@/lib/types";
import { getScoreVariant, getEngineLabel, getSentimentLabel } from "@/lib/utils";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

const PAGE_SIZE = 25;

interface ScanResultsTableProps {
  results: ParsedResult[];
  onSelect: (id: string) => void;
}

export function ScanResultsTable({ results, onSelect }: ScanResultsTableProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const paged = useMemo(
    () => results.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [results, page],
  );

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Engine</TableHead>
            <TableHead>Market</TableHead>
            <TableHead>Mentioned</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Sentiment</TableHead>
            <TableHead>Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map((r) => (
            <TableRow key={r.id} className="cursor-pointer" onClick={() => onSelect(r.id)}>
              <TableCell className="font-medium">{getEngineLabel(r.engine)}</TableCell>
              <TableCell>{r.market.toUpperCase()}</TableCell>
              <TableCell>{r.brandMentioned ? <Badge variant="positive">Yes</Badge> : <Badge variant="outline">No</Badge>}</TableCell>
              <TableCell>{r.mentionPosition ?? "-"}</TableCell>
              <TableCell><Badge variant={r.sentimentLevel === "positive" ? "positive" : r.sentimentLevel === "negative" ? "negative" : "neutral"}>{getSentimentLabel(r.sentimentLevel)}</Badge></TableCell>
              <TableCell><Badge variant={getScoreVariant(r.visibilityScore)}>{r.visibilityScore.toFixed(1)}</Badge></TableCell>
            </TableRow>
          ))}
          {results.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No results yet</TableCell></TableRow>}
        </TableBody>
      </Table>
      {results.length > PAGE_SIZE && (
        <div className="flex items-center justify-between pt-4 px-2">
          <span className="text-sm text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}&ndash;{Math.min((page + 1) * PAGE_SIZE, results.length)} of {results.length}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage(page - 1)}>
              <IconChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-2">{page + 1} / {totalPages}</span>
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
              <IconChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
