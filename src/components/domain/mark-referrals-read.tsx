"use client";

import { useEffect } from "react";

import { markReferralsRead } from "@/app-actions/member-actions";

export function MarkReferralsRead({ messageIds }: { messageIds: string[] }) {
  useEffect(() => {
    if (messageIds.length > 0) {
      void markReferralsRead(messageIds);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
