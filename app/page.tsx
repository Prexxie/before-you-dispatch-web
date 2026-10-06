import Link from "next/link";
import type { Metadata } from "next";
import { LogoMark } from "@/components/icons";
import { BRAND_NAME, TAGLINE } from "@/lib/brand";
import { CountUp, NavShadow, ScrollReveal } from "@/components/LandingMotion";

export const metadata: Metadata = {
  title: `${BRAND_NAME}: ${TAGLINE}`,
  description:
    "The customer confirms they're ready and shares exactly where to find them, before a rider is ever sent out.",
};

// Design: "Landing Page".
export default function Home() {
  return (
    <div className="page" style={{ height: "auto", minHeight: "100%" }}>
      <NavShadow />
      <ScrollReveal />
      <header className="lp-nav">
        <div className="lp-nav-bar">
          <Link href="/" className="lp-brand">
            <span className="lp-logo-tile">
              <LogoMark size={22} />
            </span>
            WakaRoute
          </Link>
          <nav className="lp-nav-links" aria-label="Main">
            <a href="#how-it-works">How it works</a>
            <a href="#features">Features</a>
            <a href="#faq">Questions</a>
            <div className="lp-nav-actions">
              <Link href="/vendor/login" className="btn btn-ghost" style={{ textDecoration: "none" }}>
                Log in
              </Link>
              <Link href="/vendor/signup" className="btn btn-primary lp-nav-cta" style={{ textDecoration: "none" }}>
                Get Started
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <section className="lp-hero">
        <span className="lp-blob a" aria-hidden="true" />
        <span className="lp-blob b" aria-hidden="true" />
        <svg className="lp-route-bg" viewBox="0 0 1280 560" preserveAspectRatio="none" fill="none" aria-hidden="true">
          <path d="M-20 470 C 220 380, 340 520, 560 400 S 900 280, 1300 120" stroke="#9AD3BC" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <div className="lp-hero-copy">
          <p className="eyebrow lp-rise d1">For vendors, customers &amp; riders</p>
          <p className="lp-h1 lp-rise d2">
            Know they&apos;re ready, <em>before you dispatch.</em>
          </p>
          <p className="lp-lead lp-rise d3">
            Stop sending riders to doors that don&apos;t open. Confirm the
            customer is home, drop a pin, and share a landmark note, all
            before a single delivery leaves the shop.
          </p>
          <div className="lp-cta-row lp-rise d4">
            <Link href="/vendor/signup" className="btn btn-primary">
              Create Your First Order
            </Link>
            <a href="#how-it-works" className="btn btn-secondary">
              See How It Works
            </a>
          </div>
          <div className="lp-trust lp-rise d5">
            {["Works on WhatsApp & SMS", "No app to download", "Same-day delivery check"].map((t) => (
              <span key={t}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t}
              </span>
            ))}
          </div>
          <div className="lp-stats lp-rise d5">
            <div>
              <div className="lp-stat-num">0</div>
              <div className="lp-stat-label">Wasted trips this week</div>
            </div>
            <div>
              <div className="lp-stat-num">
                <CountUp to={100} suffix="%" />
              </div>
              <div className="lp-stat-label">Orders confirmed first</div>
            </div>
            <div>
              <div className="lp-stat-num">
                <CountUp to={3} suffix=" min" />
              </div>
              <div className="lp-stat-label">To set up a delivery</div>
            </div>
          </div>
        </div>
        <div className="lp-hero-visual lp-rise d3">
          <HeroDemo />
        </div>
      </section>

      <>

<section className="lp-strip lp-reveal"><p className="lp-strip-label"><span>For every business that delivers</span></p><div className="lp-marquee"><div className="lp-marquee-track"><span className="lp-pill"><i className="c0"></i>Food &amp; restaurants</span><span className="lp-pill"><i className="c1"></i>E-commerce</span><span className="lp-pill"><i className="c2"></i>Retail stores</span><span className="lp-pill"><i className="c3"></i>Courier &amp; dispatch</span><span className="lp-pill"><i className="c0"></i>Phones &amp; gadgets</span><span className="lp-pill"><i className="c1"></i>Pharmacies</span><span className="lp-pill"><i className="c2"></i>Fashion &amp; clothing</span><span className="lp-pill"><i className="c3"></i>Hair &amp; beauty</span><span className="lp-pill"><i className="c0"></i>Health &amp; wellness</span><span className="lp-marquee-gap" aria-hidden="true"></span><span className="lp-pill"><i className="c0"></i>Food &amp; restaurants</span><span className="lp-pill"><i className="c1"></i>E-commerce</span><span className="lp-pill"><i className="c2"></i>Retail stores</span><span className="lp-pill"><i className="c3"></i>Courier &amp; dispatch</span><span className="lp-pill"><i className="c0"></i>Phones &amp; gadgets</span><span className="lp-pill"><i className="c1"></i>Pharmacies</span><span className="lp-pill"><i className="c2"></i>Fashion &amp; clothing</span><span className="lp-pill"><i className="c3"></i>Hair &amp; beauty</span><span className="lp-pill"><i className="c0"></i>Health &amp; wellness</span></div></div></section>

<section className="lp-section lp-problem" id="why">
<div className="lp-problem-inner">
<div className="lp-section-head"><p className="eyebrow lp-eyebrow-light">The problem</p><p className="lp-h2 lp-h2-light">Every wasted trip comes down to three causes</p></div>
<div className="lp-pains">
<div className="lp-pain lp-reveal"><span className="lp-pain-n">01</span><div className="lp-pain-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 21V4a1 1 0 0 1 1-1h9l4 4v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M3 21h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><circle cx="14" cy="13" r="1" fill="currentColor"></circle></svg></div><h3>Nobody&apos;s ready</h3><p>The customer isn&apos;t home, or hasn&apos;t even seen the order. The rider arrives, waits, calls, and turns back.</p></div>
<div className="lp-pain lp-reveal"><span className="lp-pain-n">02</span><div className="lp-pain-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 6.72 11.19 7.01 11.44a1.5 1.5 0 0 0 1.98 0C13.28 21.19 20 15.25 20 10c0-4.42-3.58-8-8-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2"></circle></svg></div><h3>Nobody can find the door</h3><p>A vague address and no landmark. The rider rings around while the time and the fuel run out.</p></div>
<div className="lp-pain lp-reveal"><span className="lp-pain-n">03</span><div className="lp-pain-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 4h6v3a2 2 0 1 0 4 0V4h6v6h-3a2 2 0 1 0 0 4h3v6h-6v-3a2 2 0 1 0-4 0v3H4v-6h3a2 2 0 1 0 0-4H4V4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg></div><h3>The details get lost</h3><p>Vendor, rider and customer each hold a piece of the story, passed along by phone and chat.</p></div>
</div>
<p className="lp-problem-foot lp-reveal">WakaRoute fixes all three, <strong>before the rider leaves the shop.</strong></p>
</div>
</section>

<section className="lp-section" id="how-it-works">
<div className="lp-section-head"><p className="eyebrow" style={{ textAlign: "center" }}>How it works</p><p className="lp-h2">Three steps, one link each</p></div>
<div className="lp-story lp-draw"><span className="lp-story-line" aria-hidden="true"></span>
<div className="lp-row">
<div className="lp-row-text lp-reveal"><span className="lp-row-n">1</span><h3>The vendor creates the order</h3><p>Enter who it&apos;s for and what&apos;s being delivered, then choose a rider. The link is ready right away.</p><ul className="lp-bullets"><li><svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"></path></svg><span>Add the name, phone and items</span></li><li><svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"></path></svg><span>Pick a rider from your team</span></li><li><svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"></path></svg><span>Send the link by WhatsApp, SMS or copy it</span></li></ul></div>
<div className="lp-row-visual lp-reveal"><div className="lp-ui">
<div className="lp-ui-bar"><span className="lp-ui-dot"></span><span className="lp-ui-dot"></span><span className="lp-ui-dot"></span><span className="lp-ui-title">New order</span></div>
<div className="lp-ui-body">
<div className="lp-ui-grid"><div><span className="lp-ui-label">Customer</span><span className="lp-ui-field">Amaka Obi</span></div><div><span className="lp-ui-label">Phone</span><span className="lp-ui-field">0803 214 7765</span></div></div>
<span className="lp-ui-label">What&apos;s being delivered</span><span className="lp-ui-field">2 bags of rice, 1 carton of drinks</span>
<span className="lp-ui-label">Rider</span><span className="lp-ui-field">Tunde · Bike</span>
<span className="lp-ui-btn">Create Order &amp; Generate Link</span>
<div className="lp-ui-send"><span>Copy Link</span><span>SMS</span><span className="wa">WhatsApp</span></div>
</div></div></div>
</div>
<div className="lp-row rev">
<div className="lp-row-text lp-reveal"><span className="lp-row-n">2</span><h3>The customer confirms and shares where to find them</h3><p>One tap to say they&apos;re ready, then a pin and a short landmark note. No rider is sent until they do.</p><ul className="lp-bullets"><li><svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"></path></svg><span>Tap &ldquo;Yes, I&apos;m ready&rdquo; or &ldquo;Not now&rdquo;</span></li><li><svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"></path></svg><span>Search the estate or street, then drag the pin</span></li><li><svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"></path></svg><span>Add a note like &ldquo;blue gate, opposite the pharmacy&rdquo;</span></li></ul></div>
<div className="lp-row-visual lp-reveal"><div className="lp-handset">
<span className="lp-handset-notch"></span>
<div className="lp-handset-body">
<span className="lp-ask-kicker">Precious Food Business</span>
<div className="lp-ask-title">Amaka, are you ready today?</div>
<span className="lp-ui-btn">Yes, I&apos;m ready</span>
<div className="lp-map lp-map-sm"><span className="road h"></span><span className="road v"></span><span className="lp-pin-static"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 6.72 11.19 7.01 11.44a1.5 1.5 0 0 0 1.98 0C13.28 21.19 20 15.25 20 10c0-4.42-3.58-8-8-8z" fill="#9F1239"></path><circle cx="12" cy="10" r="3" fill="#ffffff"></circle></svg></span></div>
<div className="lp-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5h16v11H8l-4 4V5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg><span>Blue gate, opposite the pharmacy</span></div>
</div></div></div>
</div>
<div className="lp-row">
<div className="lp-row-text lp-reveal"><span className="lp-row-n">3</span><h3>The rider delivers and marks the outcome</h3><p>Pickup point, pin and landmark note arrive in one link, so there is no back-and-forth on the phone.</p><ul className="lp-bullets"><li><svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"></path></svg><span>The pin unlocks once the rider has the items</span></li><li><svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"></path></svg><span>The customer taps &ldquo;I&apos;ve received my delivery&rdquo;</span></li><li><svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"></path></svg><span>Delivered, or failed with a reason</span></li></ul></div>
<div className="lp-row-visual lp-reveal"><div className="lp-handset">
<span className="lp-handset-notch"></span>
<div className="lp-handset-body">
<span className="lp-ask-kicker">Delivery to Amaka Obi</span>
<div className="lp-map lp-map-sm"><span className="road h"></span><span className="road v"></span><span className="lp-pin-static"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 6.72 11.19 7.01 11.44a1.5 1.5 0 0 0 1.98 0C13.28 21.19 20 15.25 20 10c0-4.42-3.58-8-8-8z" fill="#9F1239"></path><circle cx="12" cy="10" r="3" fill="#ffffff"></circle></svg></span></div>
<div className="lp-addr"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 6.72 11.19 7.01 11.44a1.5 1.5 0 0 0 1.98 0C13.28 21.19 20 15.25 20 10c0-4.42-3.58-8-8-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2"></circle></svg><span>5, Temidire Street, Mafoluku, Oshodi</span></div>
<div className="lp-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5h16v11H8l-4 4V5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg><span>Blue gate, opposite the pharmacy</span></div>
<span className="lp-ui-btn">I&apos;ve Arrived</span>
<div className="lp-chips"><span className="badge badge-success">Pin dropped</span><span className="badge badge-success">Delivered</span></div>
</div></div></div>
</div>
</div>
</section>

<section className="lp-section lp-section-tint" id="features">
<div className="lp-section-head"><p className="eyebrow" style={{ textAlign: "center" }}>Why it works</p><p className="lp-h2">Everything a last-mile delivery actually needs</p></div>
<div className="lp-features">
<div className="lp-feature lp-reveal"><div className="lp-feature-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"></path></svg></div><h3>Confirm before you send</h3><p>The customer says they&apos;re ready before any rider is sent out. No more wasted trips.</p></div>
<div className="lp-feature lp-reveal"><div className="lp-feature-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 6.72 11.19 7.01 11.44a1.5 1.5 0 0 0 1.98 0C13.28 21.19 20 15.25 20 10c0-4.42-3.58-8-8-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2"></circle></svg></div><h3>Pin-perfect location</h3><p>Customers drop a pin and add a landmark note, so &ldquo;no address&rdquo; never stops a delivery again.</p></div>
<div className="lp-feature lp-reveal"><div className="lp-feature-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"></circle><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg></div><h3>Know the outcome instantly</h3><p>Riders mark every delivery delivered or failed, with a reason, so you always know what happened.</p></div>
<div className="lp-feature lp-reveal"><div className="lp-feature-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg></div><h3>Just a link, no app</h3><p>Links go out by WhatsApp or SMS and open on any phone. Nobody downloads or signs up for anything.</p></div>
<div className="lp-feature lp-reveal"><div className="lp-feature-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M17 2l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M3 11V9a3 3 0 0 1 3-3h15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M7 22l-4-4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M21 13v2a3 3 0 0 1-3 3H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg></div><h3>Redeliver in two taps</h3><p>A failed trip keeps its history, and the customer&apos;s saved pin loads automatically next time.</p></div>
<div className="lp-feature lp-reveal"><div className="lp-feature-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg></div><h3>Same-day by design</h3><p>It&apos;s a readiness check for today, not a scheduling tool. You decide a delivery is going out today.</p></div>
</div>
</section>

<section className="lp-section" id="roles">
<div className="lp-section-head"><p className="eyebrow" style={{ textAlign: "center" }}>Made for everyone in the delivery</p><p className="lp-h2">One simple flow for all three</p></div>
<div className="lp-roles">
<div className="lp-role v lp-reveal"><span className="lp-role-tag">Vendors</span><h3>Stay in control</h3><ul><li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"></path></svg><span>Live status for every order</span></li><li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"></path></svg><span>Send links by WhatsApp, SMS or copy</span></li><li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"></path></svg><span>Redeliver a failed order in two taps</span></li></ul></div>
<div className="lp-role c lp-reveal"><span className="lp-role-tag">Customers</span><h3>Zero effort</h3><ul><li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"></path></svg><span>No app and no account</span></li><li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"></path></svg><span>Confirm in one tap</span></li><li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"></path></svg><span>Your saved pin loads next time</span></li></ul></div>
<div className="lp-role r lp-reveal"><span className="lp-role-tag">Riders</span><h3>Find the door first time</h3><ul><li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"></path></svg><span>Everything in one link</span></li><li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"></path></svg><span>Pin and landmark note, no calls</span></li><li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"></path></svg><span>Mark delivered, or failed with a reason</span></li></ul></div>
</div>
</section>

<section className="lp-section lp-section-tint">
<div className="lp-section-head"><p className="eyebrow" style={{ textAlign: "center" }}>The difference</p><p className="lp-h2">Dispatching with and without WakaRoute</p></div>
<div className="lp-compare lp-reveal">
<div className="lp-cmp lp-cmp-bad"><h3>Without WakaRoute</h3><ul><li><span className="lp-cmp-ic bad"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"></path></svg></span><span>The rider leaves and hopes someone is home</span></li><li><span className="lp-cmp-ic bad"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"></path></svg></span><span>Directions by voice note and phone calls</span></li><li><span className="lp-cmp-ic bad"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"></path></svg></span><span>Chasing riders and customers for updates</span></li><li><span className="lp-cmp-ic bad"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"></path></svg></span><span>A failed trip is just a lost trip</span></li></ul></div>
<div className="lp-cmp lp-cmp-good"><h3>With WakaRoute</h3><ul><li><span className="lp-cmp-ic good"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"></path></svg></span><span>The rider leaves only after &ldquo;I&apos;m ready&rdquo;</span></li><li><span className="lp-cmp-ic good"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"></path></svg></span><span>A pin and a landmark note in one link</span></li><li><span className="lp-cmp-ic good"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"></path></svg></span><span>Live status for every order on your dashboard</span></li><li><span className="lp-cmp-ic good"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"></path></svg></span><span>A failed trip comes with a reason, and a two-tap redelivery</span></li></ul></div>
</div>
</section>

<section className="lp-section" id="faq">
<div className="lp-section-head"><p className="eyebrow" style={{ textAlign: "center" }}>Questions</p><p className="lp-h2">Good to know before you start</p></div>
<div className="lp-faq"><details className="lp-faq-item lp-reveal"><summary>Do my customers need to install an app?<span className="lp-faq-plus"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"></path></svg></span></summary><p>No. They get a link by WhatsApp or SMS, and everything happens on a normal web page: confirming, dropping the pin and writing the landmark note.</p></details><details className="lp-faq-item lp-reveal"><summary>What does my customer actually see?<span className="lp-faq-plus"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"></path></svg></span></summary><p>A simple page with your business name, address and phone, then one tap: &ldquo;Yes, I&apos;m ready&rdquo; or &ldquo;Not now&rdquo;. If they&apos;re ready, a map opens near them so they can drop their pin and add a landmark note.</p></details><details className="lp-faq-item lp-reveal"><summary>What if my customer or rider isn&apos;t on WhatsApp?<span className="lp-faq-plus"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"></path></svg></span></summary><p>Send the link by SMS or copy it. You can open the order any time to send it again.</p></details><details className="lp-faq-item lp-reveal"><summary>Do repeat customers have to pin their location every time?<span className="lp-faq-plus"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"></path></svg></span></summary><p>No. Their pin is saved for your business, so it loads automatically on their next order. They just check it&apos;s still right and confirm.</p></details><details className="lp-faq-item lp-reveal"><summary>What happens when a delivery fails?<span className="lp-faq-plus"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"></path></svg></span></summary><p>The rider picks a reason, and you can redeliver. The customer&apos;s saved pin loads automatically, so confirming again takes two taps.</p></details></div>
</section>

<div className="lp-cta-band">
<svg className="lp-cta-pin" width="120" height="120" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 6.72 11.19 7.01 11.44a1.5 1.5 0 0 0 1.98 0C13.28 21.19 20 15.25 20 10c0-4.42-3.58-8-8-8z" fill="#ffffff"></path><circle cx="12" cy="10" r="3" fill="#065F46"></circle></svg>
<div><h3>Ready to stop wasting trips?</h3><p>Set up your first confirmed delivery in under three minutes.</p></div>
<Link href="/vendor/signup" className="btn btn-primary lp-cta-btn">Get Started, Free</Link>
</div>

<footer className="lp-footer">
<div className="lp-footer-brand"><span className="wordmark" style={{ color: "var(--ink)", fontSize: "15px" }}><LogoMark size={20} />WakaRoute</span><p>Confirm first. Dispatch smart.</p></div>
<div className="lp-footer-cols">
<div><h4>Product</h4><a href="#how-it-works">How it works</a><a href="#features">Features</a><a href="#faq">Questions</a></div>
<div><h4>Account</h4><Link href="/vendor/login">Log in</Link><Link href="/vendor/signup">Get started</Link></div>
<div><h4>Company</h4><span>About</span><span>Contact</span><span>Privacy</span></div>
</div>
</footer>

      </>
    </div>
  );
}

// The hero's looping demo of the product: the customer confirms, drops a pin
// and a note, and only then does the rider go. Purely decorative (CSS keyframes).
function HeroDemo() {
  return (
    <div className="lp-mock lp-demo" aria-hidden="true">
      <span className="lp-float f1">Pin dropped</span>
      <span className="lp-float f2">Ready</span>
      <span className="lp-float f3">Rider sent only after you confirm</span>
      <div className="lp-demo-clip">
        <div className="lp-scene s1">
          <div className="lp-ask-kicker">Precious Food Business</div>
          <div className="lp-ask-title">Amaka, are you ready for your delivery today?</div>
          <p className="lp-ask-sub">We&apos;ll only send the rider once you confirm.</p>
          <span className="btn btn-primary btn-block lp-yes" style={{ marginBottom: 10 }}>
            Yes, I&apos;m ready
          </span>
          <span className="btn btn-secondary btn-block">Not now</span>
        </div>
        <div className="lp-scene s2">
          <div className="lp-ask-kicker" style={{ marginBottom: 10 }}>
            Where can we find you?
          </div>
          <div className="lp-map">
            <span className="road h" />
            <span className="road v" />
            <span className="lp-ripple" />
            <span className="lp-ripple r2" />
            <span className="lp-pin">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 6.72 11.19 7.01 11.44a1.5 1.5 0 0 0 1.98 0C13.28 21.19 20 15.25 20 10c0-4.42-3.58-8-8-8z" fill="#9F1239" />
                <circle cx="12" cy="10" r="3" fill="#ffffff" />
              </svg>
            </span>
          </div>
          <div className="lp-note">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M4 5h16v11H8l-4 4V5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
            <span className="lp-typed">Blue gate, opposite pharmacy</span>
          </div>
        </div>
        <div className="lp-scene s3 lp-done">
          <div className="lp-check">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <path className="lp-tick" d="M5 13l4 4L19 7" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="lp-ask-title" style={{ margin: "0 0 6px 0" }}>Confirmed</div>
          <p className="lp-ask-sub" style={{ margin: 0 }}>
            Now the rider can head out, with your pin and note.
          </p>
          <div className="lp-lane">
            <span className="rider">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="6" cy="17" r="3" stroke="currentColor" strokeWidth="2" />
                <circle cx="18" cy="17" r="3" stroke="currentColor" strokeWidth="2" />
                <path d="M6 17l4-8h4l4 8M10 9h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </div>
        <div className="lp-dots">
          <i />
          <i />
          <i />
        </div>
      </div>
    </div>
  );
}
