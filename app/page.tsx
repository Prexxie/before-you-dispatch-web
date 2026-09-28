import Link from "next/link";
import type { Metadata } from "next";
import { LogoMark } from "@/components/icons";

export const metadata: Metadata = {
  title: "Before You Dispatch",
  description:
    "The customer confirms they're ready and shares exactly where to find them, before a rider is ever sent out.",
};

// Design: "Landing Page".
export default function Home() {
  return (
    <div className="page" style={{ height: "auto", minHeight: "100%" }}>
      <header className="lp-nav">
        <span className="wordmark" style={{ color: "var(--ink)" }}>
          <LogoMark />
          Before You Dispatch
        </span>
        <nav className="lp-nav-links" aria-label="Main">
          <a href="#how-it-works">How it works</a>
          <a href="#features">For vendors</a>
          <a href="#features">For riders</a>
          <Link href="/vendor/login" className="btn btn-secondary" style={{ textDecoration: "none" }}>
            Log in
          </Link>
          <Link href="/vendor/signup" className="btn btn-primary" style={{ textDecoration: "none" }}>
            Get Started
          </Link>
        </nav>
      </header>

      <section className="lp-hero">
        <div className="lp-hero-copy">
          <p className="eyebrow">For vendors, customers &amp; riders</p>
          <p className="lp-h1">
            Know they&apos;re ready, <em>before you dispatch.</em>
          </p>
          <p className="lp-lead">
            Stop sending riders to doors that don&apos;t open. Confirm the
            customer is home, drop a pin, and share a landmark note, all
            before a single delivery leaves the shop.
          </p>
          <div className="lp-cta-row">
            <Link href="/vendor/signup" className="btn btn-primary">
              Create Your First Order
            </Link>
            <a href="#how-it-works" className="btn btn-secondary">
              See How It Works
            </a>
          </div>
          <div className="lp-stats">
            <div>
              <div className="lp-stat-num">0</div>
              <div className="lp-stat-label">Wasted trips this week</div>
            </div>
            <div>
              <div className="lp-stat-num">100%</div>
              <div className="lp-stat-label">Orders confirmed first</div>
            </div>
            <div>
              <div className="lp-stat-num">3 min</div>
              <div className="lp-stat-label">To set up a delivery</div>
            </div>
          </div>
        </div>
        <div className="lp-hero-visual">
          <div className="lp-mock">
            <span className="lp-mock-badge">Confirmed ✓</span>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--brand-dark)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 10,
              }}
            >
              Delivery to Amaka Obi
            </div>
            <div className="pin-box" style={{ height: 150, marginBottom: 14 }}>
              <LogoMark size={22} />
              Blue gate, opposite pharmacy
            </div>
            <div className="row-flex">
              <span className="badge badge-success">Pin dropped</span>
              <span className="badge badge-success">Ready</span>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section" id="features">
        <div className="lp-section-head">
          <p className="eyebrow" style={{ textAlign: "center" }}>
            Why it works
          </p>
          <p className="lp-h2">Everything a last-mile delivery actually needs</p>
        </div>
        <div className="lp-features">
          <Feature icon={<CheckFeatureIcon />} title="Confirm before you send">
            The customer says they&apos;re ready, by WhatsApp link, before any
            rider is sent out. No more wasted trips.
          </Feature>
          <Feature icon={<LogoMark size={20} />} title="Pin-perfect location">
            Customers drop a pin and add a landmark note, so &quot;no
            address&quot; never stops a delivery again.
          </Feature>
          <Feature icon={<ClockFeatureIcon />} title="Know the outcome instantly">
            Riders mark every delivery delivered or failed, with a reason, so
            the vendor always knows what happened.
          </Feature>
        </div>
      </section>

      <section className="lp-section" style={{ paddingTop: 0 }} id="how-it-works">
        <div className="lp-steps">
          <Step n={1} title="Vendor creates the order">
            Enter the customer&apos;s details and what&apos;s being delivered.
            We generate a link automatically.
          </Step>
          <Step n={2} title="Customer confirms & pins location">
            One tap to confirm, then a pin and a short landmark note, no
            address needed.
          </Step>
          <Step n={3} title="Rider delivers & marks it done">
            The rider gets everything in one link, and marks the outcome when
            it&apos;s done.
          </Step>
        </div>
      </section>

      <div className="lp-cta-band">
        <div>
          <h3>Ready to stop wasting trips?</h3>
          <p>Set up your first confirmed delivery in under three minutes.</p>
        </div>
        <Link
          href="/vendor/signup"
          className="btn btn-primary"
          style={{ minHeight: 48, padding: "0 26px", textDecoration: "none" }}
        >
          Get Started, Free
        </Link>
      </div>

      <footer className="lp-footer">
        <span className="wordmark" style={{ color: "var(--ink)", fontSize: 14 }}>
          <LogoMark size={16} />
          Before You Dispatch
        </span>
        <div className="lp-footer-links">
          <span>About</span>
          <span>Contact</span>
          <span>Privacy</span>
        </div>
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="lp-feature">
      <div className="lp-feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="lp-step">
      <div className="lp-step-num">{n}</div>
      <h4>{title}</h4>
      <p>{children}</p>
    </div>
  );
}

function CheckFeatureIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockFeatureIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
