"use client";

import FieldError from "./FieldError";
import {
  MAX_CATEGORY_OTHER_LENGTH,
  VENDOR_CATEGORY_LABELS,
  VendorCategory,
} from "@/lib/api";

// "What kind of business do you run?": the dropdown, plus a text box for the
// vendor's own words that appears only when "Other" is picked. Used by both
// sign-up forms and Settings. `idPrefix` keeps ids unique where a page has
// more than one copy.
export default function CategoryField({
  idPrefix = "",
  category,
  categoryOther,
  onCategory,
  onCategoryOther,
  categoryError,
  otherError,
  onBlurCategory,
  onBlurOther,
}: {
  idPrefix?: string;
  category: VendorCategory | "";
  categoryOther: string;
  onCategory: (category: VendorCategory | "") => void;
  onCategoryOther: (text: string) => void;
  // Messages to show under each field, when there are any.
  categoryError?: string;
  otherError?: string;
  onBlurCategory?: () => void;
  onBlurOther?: () => void;
}) {
  const selectId = `${idPrefix}category`;
  const otherId = `${idPrefix}categoryOther`;
  return (
    <>
      <label className="field-label" htmlFor={selectId}>
        What kind of business do you run?
      </label>
      <select
        id={selectId}
        className="field"
        value={category}
        onChange={(e) => onCategory(e.target.value as VendorCategory | "")}
        onBlur={onBlurCategory}
        aria-invalid={!!categoryError}
        aria-describedby={categoryError ? `${selectId}-error` : undefined}
        required
      >
        <option value="" disabled>
          Choose a category
        </option>
        {Object.entries(VENDOR_CATEGORY_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <FieldError id={selectId} message={categoryError} />
      {category === "other" && (
        <>
          <label className="field-label" htmlFor={otherId}>
            Your business type
          </label>
          <input
            id={otherId}
            className="field"
            value={categoryOther}
            onChange={(e) => onCategoryOther(e.target.value)}
            maxLength={MAX_CATEGORY_OTHER_LENGTH}
            placeholder="e.g. Bakery"
            onBlur={onBlurOther}
            aria-invalid={!!otherError}
            aria-describedby={otherError ? `${otherId}-error` : undefined}
            required
          />
          <FieldError id={otherId} message={otherError} />
        </>
      )}
    </>
  );
}
