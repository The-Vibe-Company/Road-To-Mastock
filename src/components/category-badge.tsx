const colors: Record<string, string> = {
  "Upper Body": "bg-blue-100 text-blue-800",
  "Lower Body": "bg-green-100 text-green-800",
  Core: "bg-purple-100 text-purple-800",
  Cardio: "bg-red-100 text-red-800",
  "Free Weights": "bg-amber-100 text-amber-800",
};

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[category] || "bg-zinc-100 text-zinc-800"}`}
    >
      {category}
    </span>
  );
}
