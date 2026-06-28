type StatusCardProps = {
  title: string;
  value: string;
  description: string;
};

export function StatusCard({ title, value, description }: StatusCardProps) {
  return (
    <article className="mini-card">
      <strong>{title}</strong>
      <h2>{value}</h2>
      <p>{description}</p>
    </article>
  );
}
