// La description d'un talent : la phrase littéraire en italique, puis
// l'explication concrète en dessous — le « Concrètement : » des données
// n'apparaît jamais à l'écran.
export function TalentDescription({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const [lyric, concrete] = text.split(/\s*Concrètement\s*:\s*/);
  if (!concrete) return <p className={className}>{text}</p>;
  return (
    <div className={className}>
      <p className="italic opacity-80">{lyric.trim()}</p>
      <p className="mt-1.5">
        {concrete.charAt(0).toUpperCase() + concrete.slice(1)}
      </p>
    </div>
  );
}
