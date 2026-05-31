"use client";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { AIChat } from "@/components/ai/ai-chat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { canAccessAI } from "@/lib/permissions";

export default function AIAssistantPage() {
  return (
    <PermissionGuard canAccess={canAccessAI}>
      <div className="space-y-6">
        <section>
          <h1 className="text-3xl font-bold text-slate-950">AI Assistant</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Tanya progress job desk, kendala, deadline, dan ringkasan acara
            berdasarkan data JobDex.in.
          </p>
        </section>
        <Card>
          <CardHeader>
            <CardTitle>Asisten koordinasi</CardTitle>
          </CardHeader>
          <CardContent>
            <AIChat />
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
