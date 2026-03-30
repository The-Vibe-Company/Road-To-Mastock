import { Badge } from "@/components/ui/badge";

const variants: Record<string, "default" | "secondary" | "outline"> = {
  "Upper Body": "default",
  "Lower Body": "secondary",
  Core: "outline",
  Cardio: "default",
  "Free Weights": "outline",
};

export function CategoryBadge({ category }: { category: string }) {
  return <Badge variant={variants[category] || "outline"}>{category}</Badge>;
}
