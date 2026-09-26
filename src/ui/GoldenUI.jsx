import { useEffect, useId } from "react";

export const COLORS = Object.freeze({
  cream: "#F7F7F5",
  sand: "#ECECE8",
  ink: "#0A0A0A",
  gold: "#EEFF6A",
  amber: "#0A0A0A",
  dusk1: "#0A0A0A",
  dusk2: "#161616",
  dusk3: "#222222",
  green: "#8DE24A",
  mute: "#6B6B6B",
  line: "#E3E3DE",
  white: "#FFFFFF",
});

export const FONTS = Object.freeze({
  serif: "'Manrope', 'Inter', system-ui, sans-serif",
  sans: "'Inter', system-ui, sans-serif",
  mark: "'Baloo 2', sans-serif",
  mono: "'Inter', system-ui, sans-serif",
});

export const DUSK = `linear-gradient(180deg, ${COLORS.dusk1} 0%, ${COLORS.dusk2} 60%, ${COLORS.dusk3} 100%)`;
export const palette = COLORS;
export const fonts = FONTS;
export const PAGE_WIDTH = 390;
export const PAGE_INSET = 18;

export const SPACE = Object.freeze({
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
  12: 48,
});

export const TYPE_STYLES = Object.freeze({
  display: Object.freeze({ fontSize: 32, lineHeight: 1.08, fontWeight: 800, letterSpacing: "-0.03em" }),
  title: Object.freeze({ fontSize: 28, lineHeight: 1.1, fontWeight: 800, letterSpacing: "-0.03em" }),
  section: Object.freeze({ fontSize: 20, lineHeight: 1.2, fontWeight: 700, letterSpacing: "-0.02em" }),
  body: Object.freeze({ fontSize: 14, lineHeight: 1.5 }),
  small: Object.freeze({ fontSize: 12, lineHeight: 1.5 }),
  eyebrow: Object.freeze({ fontSize: 10, lineHeight: 1.2, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase" }),
});

export const FIELD_STYLES = Object.freeze({
  width: "100%",
  minHeight: 48,
  boxSizing: "border-box",
  border: `1px solid ${COLORS.line}`,
  borderRadius: 16,
  background: COLORS.white,
  color: COLORS.ink,
  padding: "12px 16px",
  fontFamily: FONTS.sans,
  fontSize: 14,
  lineHeight: 1.5,
  outlineColor: COLORS.ink,
});

const basePage = {
  width: "100%",
  maxWidth: PAGE_WIDTH,
  minHeight: "100%",
  boxSizing: "border-box",
  margin: "0 auto",
  background: COLORS.cream,
  color: COLORS.ink,
  fontFamily: FONTS.sans,
};

export function Page({ children, tone = "cream", dark, scroll = true, style, ...props }) {
  const isDark = dark ?? ["dusk", "dark", "ink"].includes(tone);
  return (
    <main
      {...props}
      style={{
        ...basePage,
        background: isDark ? DUSK : tone === "gold" ? COLORS.gold : COLORS.cream,
        color: isDark ? COLORS.cream : COLORS.ink,
        overflowY: scroll ? "auto" : undefined,
        WebkitOverflowScrolling: "touch",
        ...style,
      }}
    >
      {children}
    </main>
  );
}

export function Header({
  title,
  eyebrow,
  subtitle,
  onBack,
  action,
  dark = false,
  style,
}) {
  const foreground = dark ? COLORS.cream : COLORS.ink;
  return (
    <header
      style={{
        position: "relative",
        padding: onBack ? "10px 18px 12px" : "20px 18px 12px",
        color: foreground,
        ...style,
      }}
    >
      {onBack && (
        <button
          type="button"
          aria-label="Go back"
          onClick={onBack}
          style={{ minHeight: 44, display: "inline-flex", alignItems: "center", gap: 5, border: 0, background: "transparent", color: dark ? "#FFFFFFCC" : COLORS.ink, padding: 0, fontFamily: FONTS.sans, ...TYPE_STYLES.eyebrow, cursor: "pointer" }}
        >
          <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>‹</span>back
        </button>
      )}
      <div style={{ minWidth: 0 }}>
        {eyebrow && <div style={eyebrowStyle(dark)}>{eyebrow}</div>}
        {title && (
          <h1
            style={{
              margin: eyebrow ? "4px 0 0" : 0,
              color: foreground,
              fontFamily: FONTS.serif,
              ...TYPE_STYLES.title,
            }}
          >
            {title}
          </h1>
        )}
        {subtitle && (
          <p style={{ ...bodyStyle(dark), margin: "8px 0 0", ...TYPE_STYLES.small }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div style={{ position: "absolute", top: 16, right: 18 }}>{action}</div>}
    </header>
  );
}

export function Card({ children, dark = false, tone, onClick, style, ...props }) {
  const isDark = dark || ["dusk", "dark", "ink"].includes(tone);
  const cardStyle = {
    boxSizing: "border-box",
    background: isDark ? COLORS.ink : COLORS.white,
    color: isDark ? COLORS.cream : COLORS.ink,
    border: isDark ? "none" : `1px solid ${COLORS.line}`,
    borderRadius: 20,
    padding: 16,
    boxShadow: "0 8px 30px rgba(22,19,16,.05)",
    width: "100%",
    textAlign: "left",
    ...style,
  };
  if (onClick) {
    return (
      <button
        {...props}
        type="button"
        onClick={onClick}
        style={{ ...cardStyle, cursor: "pointer", font: "inherit" }}
      >
        {children}
      </button>
    );
  }
  return (
    <section {...props} style={cardStyle}>
      {children}
    </section>
  );
}

export function Button({
  children,
  kind,
  variant = "ink",
  disabled = false,
  fullWidth = true,
  style,
  type = "button",
  ...props
}) {
  const variants = {
    ink: { background: COLORS.ink, color: COLORS.gold, border: "none" },
    primary: { background: COLORS.ink, color: COLORS.gold, border: "none" },
    gold: { background: COLORS.gold, color: COLORS.ink, border: "none" },
    accent: { background: COLORS.gold, color: COLORS.ink, border: "none" },
    ghost: {
      background: "transparent",
      color: COLORS.ink,
      border: `1.5px solid ${COLORS.ink}`,
    },
    light: { background: COLORS.white, color: COLORS.ink, border: "none" },
  };
  return (
    <button
      {...props}
      type={type}
      disabled={disabled}
      style={{
        ...(variants[variant || kind || "ink"] || variants.ink),
        ...(disabled
          ? { background: COLORS.line, color: COLORS.mute, border: "none" }
          : {}),
        width: fullWidth ? "100%" : undefined,
        minHeight: 52,
        boxSizing: "border-box",
        textAlign: "center",
        borderRadius: 999,
        padding: "14px 18px",
        fontFamily: FONTS.sans,
        fontWeight: 600,
        fontSize: 13,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        cursor: disabled ? "default" : "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export const Btn = Button;

export function Pill({ children, active = false, dark = false, tone, style, ...props }) {
  dark = dark || ["dusk", "dark", "ink"].includes(tone);
  active = active || tone === "gold";
  const selected = active
    ? { background: COLORS.gold, color: COLORS.ink, borderColor: COLORS.gold }
    : dark
      ? { background: "#FFFFFF12", color: COLORS.cream, borderColor: "#FFFFFF38" }
      : { background: COLORS.white, color: COLORS.ink, borderColor: COLORS.line };
  return (
    <span
      {...props}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 28,
        boxSizing: "border-box",
        border: "1px solid",
        borderRadius: 999,
        padding: "5px 10px",
        fontFamily: FONTS.sans,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.06em",
        ...selected,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function Row({
  title,
  label,
  detail,
  leading,
  trailing,
  children,
  onClick,
  style,
  ...props
}) {
  const content = (
    <>
      {leading}
      <span style={{ minWidth: 0, flex: 1 }}>
        {(title || label) && <span style={{ display: "block", fontWeight: 600 }}>{title || label}</span>}
        {detail && (
          <span style={{ display: "block", marginTop: 3, color: COLORS.mute, fontSize: 12 }}>
            {detail}
          </span>
        )}
        {children}
      </span>
      {trailing}
    </>
  );
  const rowStyle = {
    width: "100%",
    minHeight: 48,
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 0",
    color: COLORS.ink,
    fontFamily: FONTS.sans,
    fontSize: 14,
    lineHeight: 1.5,
    textAlign: "left",
    border: 0,
    borderBottom: `1px solid ${COLORS.line}`,
    background: "transparent",
    ...style,
  };
  return onClick ? (
    <button {...props} type="button" onClick={onClick} style={{ ...rowStyle, cursor: "pointer" }}>
      {content}
    </button>
  ) : (
    <div {...props} style={rowStyle}>{content}</div>
  );
}

export function Progress({ value = 0, max = 100, label, dark = false, style }) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div style={{ width: "100%", ...style }}>
      {label && (
        <div style={{ ...eyebrowStyle(dark), display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
          <span>{label}</span><span>{Math.round(percent)}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label || "Progress"}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.min(max, Math.max(0, value))}
        style={{ height: 6, overflow: "hidden", borderRadius: 999, background: dark ? "#FFFFFF24" : COLORS.line }}
      >
        <div style={{ width: `${percent}%`, height: "100%", borderRadius: 999, background: dark ? COLORS.gold : COLORS.ink, transition: "width .3s ease" }} />
      </div>
    </div>
  );
}

export function EmptyState({ title, description, action, dark = false, style }) {
  return (
    <div style={{ padding: "32px 18px", textAlign: "center", color: dark ? COLORS.cream : COLORS.ink, ...style }}>
      <div style={{ margin: "0 auto 16px", display: "flex", justifyContent: "center" }}><Sun size={38} /></div>
      {title && <h2 style={{ margin: 0, fontFamily: FONTS.serif, ...TYPE_STYLES.section }}>{title}</h2>}
      {description && <p style={{ ...bodyStyle(dark), maxWidth: 290, margin: "8px auto 0" }}>{description}</p>}
      {action && <div style={{ marginTop: 18 }}>{action}</div>}
    </div>
  );
}

export function Notice({ children, tone = "info", dark = false, style }) {
  dark = dark || ["dusk", "dark", "ink"].includes(tone);
  const toneStyles = {
    info: { background: "#F1F0E8", border: COLORS.line, accent: COLORS.ink },
    success: { background: "#EFF7E8", border: "#CFE7B7", accent: "#315D21" },
    warning: { background: "#FFF6D7", border: "#E9D99A", accent: "#69520A" },
  }[tone] || { background: "#F1F0E8", border: COLORS.line, accent: COLORS.ink };
  return (
    <div role="status" style={{ border: `1px solid ${dark ? "#FFFFFF35" : toneStyles.border}`, borderRadius: 14, padding: "12px 14px", background: dark ? "#FFFFFF10" : toneStyles.background, color: dark ? COLORS.cream : toneStyles.accent, fontFamily: FONTS.sans, fontSize: 13, lineHeight: 1.45, ...style }}>
      {children}
    </div>
  );
}

function ModalFrame({ children, open = true, onClose, title, sheet = false, style }) {
  const titleId = useId();
  useEffect(() => {
    if (!open || !onClose) return undefined;
    const onKeyDown = (event) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}
      style={{ position: "fixed", zIndex: 1000, inset: 0, display: "flex", alignItems: sheet ? "flex-end" : "center", justifyContent: "center", padding: sheet ? 0 : 16, background: "rgba(0,0,0,.52)" }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        style={{ width: "100%", maxWidth: PAGE_WIDTH, maxHeight: "min(88dvh, 760px)", overflowY: "auto", boxSizing: "border-box", position: "relative", background: COLORS.cream, color: COLORS.ink, borderRadius: sheet ? "24px 24px 0 0" : 20, padding: 18, boxShadow: "0 24px 80px rgba(0,0,0,.28)", ...style }}
      >
        {(title || onClose) && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: title || children ? 16 : 0 }}>
            {title && <h2 id={titleId} style={{ flex: 1, margin: 0, fontFamily: FONTS.serif, ...TYPE_STYLES.section }}>{title}</h2>}
            {onClose && <button type="button" aria-label="Close" onClick={onClose} style={iconButtonStyle(false)}>×</button>}
          </div>
        )}
        {children}
      </section>
    </div>
  );
}

export function Modal(props) { return <ModalFrame {...props} />; }
export function Sheet(props) { return <ModalFrame {...props} sheet />; }

export function Sun({ size = 40, style, title = "Golden sun" }) {
  return (
    <svg role="img" aria-label={title} width={size} height={size} viewBox="0 0 40 40" style={{ display: "block", flexShrink: 0, ...style }}>
      <circle cx="20" cy="20" r="10.5" fill={COLORS.gold} />
      <path d="M20 2.5v5M20 32.5v5M2.5 20h5M32.5 20h5M7.63 7.63l3.54 3.54m17.66 17.66 3.54 3.54m0-24.74-3.54 3.54m-17.66 17.66-3.54 3.54" stroke={COLORS.ink} strokeWidth="2" strokeLinecap="round" />
      <circle cx="16.5" cy="18.5" r="1" fill={COLORS.ink} />
      <circle cx="23.5" cy="18.5" r="1" fill={COLORS.ink} />
      <path d="M16 23c1.15 1.4 2.45 2.1 4 2.1s2.85-.7 4-2.1" fill="none" stroke={COLORS.ink} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function SunMark({ size = 40, mood = "calm", style, title }) {
  return <Sun size={size} title={title || `Golden sun ${mood}`} style={style} />;
}

export const fieldStyle = FIELD_STYLES;

function iconButtonStyle(dark) {
  return { width: 48, height: 48, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", border: `1px solid ${dark ? "#FFFFFF40" : COLORS.line}`, borderRadius: 999, background: dark ? "#FFFFFF10" : COLORS.white, color: dark ? COLORS.cream : COLORS.ink, fontFamily: FONTS.sans, fontSize: 23, lineHeight: 1, cursor: "pointer" };
}

function eyebrowStyle(dark) {
  return { color: dark ? COLORS.gold : COLORS.mute, fontFamily: FONTS.sans, ...TYPE_STYLES.eyebrow };
}

function bodyStyle(dark) {
  return { color: dark ? "#FFFFFFCC" : "#1A1A1A", fontFamily: FONTS.sans, ...TYPE_STYLES.body };
}
