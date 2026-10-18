import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import { AI_ENGINES } from "@/lib/constants";
import type { ReactNode } from "react";

interface EngineTabsProps {
  children: (engine: string | null) => ReactNode;
}

export function EngineTabs({ children }: EngineTabsProps) {
  return (
    <Tabs defaultValue="all">
      <TabsList>
        <TabsTrigger value="all">All Engines</TabsTrigger>
        {AI_ENGINES.map((e) => <TabsTrigger key={e.value} value={e.value}>{e.label}</TabsTrigger>)}
      </TabsList>
      <TabsContent value="all">{children(null)}</TabsContent>
      {AI_ENGINES.map((e) => <TabsContent key={e.value} value={e.value}>{children(e.value)}</TabsContent>)}
    </Tabs>
  );
}
