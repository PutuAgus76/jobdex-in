"use client";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { AIChat } from "@/components/ai/ai-chat";
import { canAccessAI } from "@/lib/permissions";

export default function AIAssistantPage() {
  return (
    <PermissionGuard canAccess={canAccessAI}>
      <div className="flex flex-col h-[calc(100vh-11rem)] md:h-[calc(100vh-7.5rem)] max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-border shrink-0 mb-4">
          <div className="flex items-center gap-2">
            <span className="jd-neo-badge bg-main text-main-foreground font-black text-xs">
              AI Assistant
            </span>
            <h1 className="text-sm font-bold text-[var(--jd-neo-muted)]">
              Tanya progress, deadline, &amp; aset secara real-time
            </h1>
          </div>
        </div>
        <AIChat />
      </div>
    </PermissionGuard>
  );
}
