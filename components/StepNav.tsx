import { BackIcon, ForwardIcon } from "./icons";

// Back and forward between the customer's steps, like a browser: Back goes to
// the page you came from, and Forward (only after going back) returns to the
// page you left, with whatever you'd entered still there.
export default function StepNav({
  onBack,
  onForward,
}: {
  onBack?: () => void;
  onForward?: () => void;
}) {
  if (!onBack && !onForward) return null;
  return (
    <div className="step-nav">
      {onBack ? (
        <button type="button" onClick={onBack} className="tag-back">
          <BackIcon />
          Back
        </button>
      ) : (
        <span />
      )}
      {onForward && (
        <button type="button" onClick={onForward} className="tag-back">
          Forward
          <ForwardIcon />
        </button>
      )}
    </div>
  );
}
