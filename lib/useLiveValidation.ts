"use client";

import { useState } from "react";

// Field errors that appear and clear as the person types, instead of only
// after pressing submit. The form passes the errors for its *current* values
// (a plain function of the form state, recomputed every render); this decides
// which of them to show:
//  - a field's error shows once the person has left the field (blur), so
//    "a@b" isn't flagged while the email is still being typed;
//  - from then on it updates on every keystroke, and disappears the moment
//    the value is valid;
//  - after a submit attempt, every field's error shows.
export function useLiveValidation<F extends string>(
  errors: Partial<Record<F, string>>,
) {
  const [touched, setTouched] = useState<ReadonlySet<F>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  return {
    // For onBlur on the field's input.
    onBlur: (field: F) => () =>
      setTouched((t) => (t.has(field) ? t : new Set(t).add(field))),
    // The message to show under the field, if any.
    error: (field: F): string | undefined =>
      submitted || touched.has(field) ? errors[field] : undefined,
    // Call at the top of submit; returns true when every field is valid.
    // On false, all errors become visible.
    validateAll: (): boolean => {
      setSubmitted(true);
      return Object.values(errors).every((e) => !e);
    },
  };
}
