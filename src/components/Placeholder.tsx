/**
 * Shared "Coming next session" placeholder. Every sidebar tab renders
 * this until its real UI lands in a later session. Keeps the empty
 * shell consistent and makes it obvious what's wired but not yet built.
 */
export function Placeholder({
  icon,
  title,
  note,
}: {
  icon: string;
  title: string;
  note?: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h2 className="text-2xl font-black mb-2">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          {title}
        </span>
      </h2>
      <p className="text-gray-500 text-sm max-w-sm">
        {note ?? "Coming next session."}
      </p>
    </div>
  );
}
