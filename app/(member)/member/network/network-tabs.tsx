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
    <Tabs defaultValue={defaultTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="network">My Network</TabsTrigger>
        <TabsTrigger value="discover">Discover</TabsTrigger>
        <TabsTrigger value="insights">Insights</TabsTrigger>
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
