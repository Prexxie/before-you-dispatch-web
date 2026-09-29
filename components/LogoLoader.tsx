// The WakaRoute mark drawing itself, on a loop: the route travels the W, the
// confirmed pin drops at the end, then it fades and starts again. Used for
// every loading state. With reduced motion it's the still mark.
// Styles: `.logo-loader` in globals.css.
export default function LogoLoader({
  size = 56,
  label = "Loading…",
  showLabel = true,
}: {
  size?: number;
  label?: string;
  showLabel?: boolean;
}) {
  return (
    <div className="logo-loader" role="status" aria-live="polite">
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <g className="ll-all">
          <path
            className="ll-route"
            pathLength={1}
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
