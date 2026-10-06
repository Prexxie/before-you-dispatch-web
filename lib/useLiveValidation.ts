"use client";

import { useState } from "react";

// Field errors that appear and clear as the person types, instead of only
// after pressing submit. The form passes the errors for its *current* values
// (a plain function of the form state, recomputed every render) and, ideally,
// the values themselves; this decides which of the errors to show:
//  - a field's error shows as soon as the person starts typing in it (its
//    value differs from what it started with), then updates on every
//    keystroke and disappears the moment the value is valid;
//  - a field that wasn't passed in `values` falls back to showing once the
//    person has left it (blur);
//  - after a submit attempt, every field's error shows.
export function useLiveValidation<F extends string>(
  errors: Partial<Record<F, string>>,
  values?: Partial<Record<F, unknown>>,
) {
  const [touched, setTouched] = useState<ReadonlySet<F>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  // Values at the first render, to tell "typed in" from "prefilled".
  const [initial] = useState(values);
  const [edited, setEdited] = useState<ReadonlySet<F>>(new Set());
  // Fields whose value has moved since the first render. Adjusting state while
  // rendering (React re-renders straight away) so the error shows on the very
  // keystroke, not one render later.
  const fresh = values
    ? (Object.keys(values) as F[]).filter(
        (key) => !edited.has(key) && !Object.is(values[key], initial?.[key]),
      )
    : [];
  if (fresh.length > 0) setEdited(new Set([...edited, ...fresh]));

  return {
    // For onBlur on the field's input.
    onBlur: (field: F) => () =>
      setTouched((t) => (t.has(field) ? t : new Set(t).add(field))),
    // The message to show under the field, if any.
    error: (field: F): string | undefined =>
      submitted || touched.has(field) || edited.has(field)
        ? errors[field]
        : undefined,
    // Call at the top of submit; returns true when every field is valid.
    // On false, all errors become visible.
    validateAll: (): boolean => {
      setSubmitted(true);
      return Object.values(errors).every((e) => !e);
    },
  };
}
