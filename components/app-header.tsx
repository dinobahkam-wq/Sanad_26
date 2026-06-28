import Link from "next/link";

export function AppHeader() {
  return (
    <header className="topbar">
      <Link className="brand" href="/" aria-label="سند">
        <span className="brand-mark" aria-hidden="true">
          س
        </span>
        <span>سند</span>
      </Link>
      <nav className="actions" aria-label="روابط التطبيق">
        <Link className="nav-link" href="/share">
          مشاركة إشعار
        </Link>
        <Link className="nav-link" href="/workspace">
          مساحة العمل
        </Link>
      </nav>
    </header>
  );
}
