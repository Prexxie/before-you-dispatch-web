import { ReactNode } from "react";

// Layout of the phone artboards (customer and rider, 390px): off-white page,
// 48px padding, and on single-message screens the content centred vertically.
export default function PhoneScreen({
  children,
  centered = false,
}: {
  children: ReactNode;
  centered?: boolean;
}) {
  return (
    <div className="page">
      <main
        className={`content ${centered ? "flex flex-col justify-center" : ""}`}
      >
        <div className="mx-auto w-full max-w-[480px]">{children}</div>
      </main>
    </div>
  );
}

export type Tone = "neutral" | "brand" | "accent" | "danger";

const TONE_STYLES: Record<Tone, string> = {
  neutral: "bg-[#F3F1EC] text-[#6B6558]",
  brand: "bg-brand-tint text-brand",
  accent: "bg-accent-tint text-accent",
  danger: "bg-[#FEF2F2] text-danger",
};

// Single-message screen in the style of "Customer: Not Now": round icon,
// eyebrow, title, explanation, then optional extras.
export function ResultScreen({
  icon,
  tone,
  eyebrow,
  title,
  sub,
  children,
}: {
  icon: ReactNode;
  tone: Tone;
  eyebrow: string;
  title: string;
  sub: string;
  children?: ReactNode;
}) {
  return (
    <PhoneScreen centered>
      <div className={`state-icon ${TONE_STYLES[tone]}`}>{icon}</div>
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="h1">{title}</h1>
      <p className="sub">{sub}</p>
      {children}
    </PhoneScreen>
  );
}

// "rice & drinks." -> "Rice & drinks": sentence-case without a trailing full
// stop, so it can start a sentence in the designs' copy.
export function asSentenceStart(text: string): string {
  const trimmed = text.trim().replace(/\.+$/, "");
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
