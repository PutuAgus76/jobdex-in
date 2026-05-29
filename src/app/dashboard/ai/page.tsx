"use client";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { canAccessAI } from "@/lib/permissions";

export default function AIAssistantPage() {
  return (
    <PermissionGuard canAccess={canAccessAI}>
      <div className="space-y-6">
        <section>
          <Badge variant="warning">Placeholder</Badge>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">
            AI Assistant
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Area ini disiapkan untuk ringkasan progres berbasis AI pada fase
            integrasi Gemini.
          </p>
        </section>
        <Card>
          <CardHeader>
            <CardTitle>Asisten koordinasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-[8px] border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              Gemini belum diintegrasikan pada fase ini.
            </div>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
