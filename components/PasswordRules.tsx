import { PASSWORD_RULES } from "@/lib/validate";

// Live checklist under a "choose a password" field: each rule ticks as the
// typed password meets it.
export default function PasswordRules({ password }: { password: string }) {
  return (
    <ul className="password-rules" aria-label="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <li key={rule.label} className={ok ? "ok" : undefined}>
            <span aria-hidden="true">{ok ? "✓" : "○"}</span> {rule.label}
            <span className="sr-only">{ok ? " (met)" : " (not met)"}</span>
          </li>
        );
      })}
    </ul>
  );
}
