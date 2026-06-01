"use client";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { AIChat } from "@/components/ai/ai-chat";
import { canAccessAI } from "@/lib/permissions";

export default function AIAssistantPage() {
  return (
    <PermissionGuard canAccess={canAccessAI}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <section className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
          <h1 className="text-3xl font-bold text-slate-950 dark:text-slate-50">AI Assistant</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Tanya progress job desk, kendala, deadline, dan referensi desain secara real-time.
          </p>
        </section>
        <AIChat />
      </div>
    </PermissionGuard>
  );
}
