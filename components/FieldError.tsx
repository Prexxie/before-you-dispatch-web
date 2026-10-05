// The red message under a field. Renders nothing when there's no error. Give
// the input aria-describedby={`${id}-error`} while it shows.
export default function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={`${id}-error`} className="field-error">
      {message}
    </p>
  ) : null;
}
