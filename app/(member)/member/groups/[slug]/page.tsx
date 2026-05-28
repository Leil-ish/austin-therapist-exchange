import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGroupBySlug } from "@/lib/data/live-data";

export default async function MemberGroupDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);

  if (!group) {
    notFound();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="bg-white/90">
        <CardHeader className="space-y-4">
          <Badge variant={group.visibility === "public" ? "default" : "outline"}>{group.visibility}</Badge>
          <CardTitle>{group.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
          <p>{group.description}</p>
          <p>This member page will eventually hold group discussion threads, membership controls, and group-specific updates.</p>
        </CardContent>
      </Card>

      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle>Group rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
          <p>Only active members can participate in private groups.</p>
          <p>Public group metadata can be surfaced outside authentication, but private conversations stay internal.</p>
        </CardContent>
      </Card>
    </div>
  );
}
