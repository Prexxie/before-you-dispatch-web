// The WakaRoute mark drawing itself, on a loop: the route travels the W, the
// confirmed pin drops at the end, then it fades and starts again. Used for
// every loading state. With reduced motion it's the still mark.
// Styles: `.logo-loader` in globals.css.
// `page`: a whole page is loading (the vendor pages), so it's larger and is
// centred on the whole screen, sidebar included. The sidebar and top bar stay
// visible and clickable around it.
export default function LogoLoader({
  size,
  label = "Loading…",
  showLabel = true,
  page = false,
  cover = false,
  title,
}: {
  size?: number;
  label?: string;
  showLabel?: boolean;
  page?: boolean;
  // With `page`: also hide everything behind it (login and sign-up, where
  // the form shouldn't show while the vendor is being signed in).
  cover?: boolean;
  // A heading above the logo ("Welcome!").
  title?: string;
}) {
  size ??= page ? 160 : 72;
  return (
    <div
      className={`logo-loader${page ? " logo-loader-page" : ""}${page && cover ? " logo-loader-cover" : ""}`}
      role="status"
      aria-live="polite"
    >
      {title && <span className="logo-loader-title">{title}</span>}
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <g className="ll-all">
          <path
            className="ll-route"
            d="M6 15 L13.5 35 L21.5 21.5 L29.5 35 L38 23"
            stroke="#9F1239"
            strokeWidth="4.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle className="ll-start" cx="6" cy="15" r="3" stroke="#9F1239" strokeWidth="2.4" />
          <g className="ll-pin">
            <path d="M38 23C36 20 31 13.6 31 11A7 7 0 1 1 45 11C45 13.6 40 20 38 23Z" fill="#9F1239" />
            <path d="M35 11.2 L37.2 13.3 L41.2 8.9" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </g>
      </svg>
      {showLabel ? <span className="logo-loader-label">{label}</span> : <span className="sr-only">{label}</span>}
    </div>
  );
}
