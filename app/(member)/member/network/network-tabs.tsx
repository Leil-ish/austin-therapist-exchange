"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Tab = "network" | "discover" | "insights";

export function NetworkTabs({
  defaultTab,
  networkContent,
  discoverContent,
  insightsContent,
}: {
  defaultTab: Tab;
  networkContent: React.ReactNode;
  discoverContent: React.ReactNode;
  insightsContent: React.ReactNode;
}) {
  function handleTabChange(value: string) {
    const params = new URLSearchParams(window.location.search);
    params.set("tab", value);
    window.history.replaceState(null, "", `?${params.toString()}`);
  }

  return (
    <Tabs defaultValue={defaultTab} onValueChange={handleTabChange} className="space-y-0">
      <TabsList className="flex w-full justify-center gap-8 border-b border-border bg-transparent px-0 pb-0">
        <TabsTrigger
          value="network"
          className="rounded-none border-b-2 border-transparent pb-3 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
        >
          My Network
        </TabsTrigger>
        <TabsTrigger
          value="discover"
          className="rounded-none border-b-2 border-transparent pb-3 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
        >
          Discover
        </TabsTrigger>
        <TabsTrigger
          value="insights"
          className="rounded-none border-b-2 border-transparent pb-3 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
        >
          Insights
        </TabsTrigger>
      </TabsList>

      <TabsContent value="network" className="mt-6">
        {networkContent}
      </TabsContent>

      <TabsContent value="discover" className="mt-6">
        {discoverContent}
      </TabsContent>

      <TabsContent value="insights" className="mt-6">
        {insightsContent}
      </TabsContent>
    </Tabs>
  );
}
