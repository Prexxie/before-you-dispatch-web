import Link from "next/link";

export type Crumb = {
  label: string;
  // A link to another page, or (inside a multi-step form that shouldn't
  // reload) a handler. The last crumb is the current page and has neither.
  href?: string;
  onClick?: () => void;
};

// Design: the breadcrumb trail above the page title ("Dashboard > Riders",
// "Home > Log in"). Styles: `.crumbs` in globals.css.
export default function Breadcrumbs({
  items,
  className,
  style,
}: {
  items: Crumb[];
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`crumbs${className ? ` ${className}` : ""}`}
      style={style}
    >
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={`${item.label}-${i}`} className="crumb">
            {i > 0 && (
              <span className="sep" aria-hidden="true">
                ›
              </span>
            )}
            {last ? (
              <span aria-current="page">{item.label}</span>
            ) : item.href ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <button type="button" onClick={item.onClick}>
                {item.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
