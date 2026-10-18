import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { IconWorld, IconBuildingStore, IconMapPin } from "@tabler/icons-react";
import type { Project } from "@/lib/types";
import { MARKETS } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const market = MARKETS.find((m) => m.value === project.market);
  return (
    <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={onClick}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{project.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <IconBuildingStore className="h-4 w-4" />
            <span>{project.brandName}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <IconWorld className="h-4 w-4" />
            <span className="truncate">{project.siteUrl}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <IconMapPin className="h-4 w-4" />
            <span>{market?.label ?? project.market}</span>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <Badge variant="secondary">{project.industry || "General"}</Badge>
          <span className="text-xs text-muted-foreground">{formatRelativeTime(project.updatedAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
