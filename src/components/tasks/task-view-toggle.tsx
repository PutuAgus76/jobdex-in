import { Button } from "@/components/ui/button";

export type TaskViewMode = "table" | "card";

type TaskViewToggleProps = {
  value: TaskViewMode;
  onChange: (value: TaskViewMode) => void;
};

export function TaskViewToggle({ value, onChange }: TaskViewToggleProps) {
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        size="sm"
        variant={value === "table" ? "primary" : "secondary"}
        onClick={() => onChange("table")}
      >
        Table
      </Button>
      <Button
        type="button"
        size="sm"
        variant={value === "card" ? "primary" : "secondary"}
        onClick={() => onChange("card")}
      >
        Card
      </Button>
    </div>
  );
}
