export default function Label({ n, children }: { n?: string; children: React.ReactNode }) {
  return (
    <p className="label">
      <i>[</i>
      {n && <b>{n}</b>}
      <span>{children}</span>
      <i>]</i>
    </p>
  );
}
