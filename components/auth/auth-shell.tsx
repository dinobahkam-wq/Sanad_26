import Link from "next/link";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthShell({ eyebrow, title, description, children, footer }: AuthShellProps) {
  return (
    <main className="auth-shell">
      <section className="panel page-card auth-card">
        <Link className="brand auth-brand" href="/" aria-label="سند">
          <span className="brand-mark" aria-hidden="true">
            س
          </span>
          <span>سند</span>
        </Link>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
        {children}
        {footer ? <div className="auth-footer">{footer}</div> : null}
      </section>
    </main>
  );
}
