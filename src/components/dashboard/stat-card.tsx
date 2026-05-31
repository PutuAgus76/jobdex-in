import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: number | string;
  description: string;
};

export function StatCard({ label, value, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-slate-950 dark:text-slate-50">{value}</p>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
      </CardContent>
    </Card>
  );
}
