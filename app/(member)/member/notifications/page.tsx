import { requireMember } from "@/lib/auth/guards";
import { getNotifications } from "@/lib/data/live-data";
import { NotificationsList } from "@/components/domain/notifications-list";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const session = await requireMember();
  const notifications = await getNotifications(session.userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl">Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Updates about referrals and your network activity.
        </p>
      </div>
      <NotificationsList notifications={notifications} />
    </div>
  );
}
