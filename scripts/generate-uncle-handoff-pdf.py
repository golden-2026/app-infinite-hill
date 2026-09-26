from pathlib import Path

from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing, Rect
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs" / "Golden-Uncle-Handoff.pdf"

INK = colors.HexColor("#0A0A0A")
GOLD = colors.HexColor("#EEFF6A")
CREAM = colors.HexColor("#F7F7F5")
AMBER = colors.HexColor("#D8A940")
MUTED = colors.HexColor("#6F6B61")
LINE = colors.HexColor("#DEDCD4")

FONT_REGULAR = "Helvetica"
FONT_BOLD = "Helvetica-Bold"
FONT_MONO = "Courier"

font_candidates = [
    ("Inter", "/System/Library/Fonts/Supplemental/Arial.ttf"),
    ("InterBold", "/System/Library/Fonts/Supplemental/Arial Bold.ttf"),
]
for name, path in font_candidates:
    if Path(path).exists():
        pdfmetrics.registerFont(TTFont(name, path))
if "Inter" in pdfmetrics.getRegisteredFontNames():
    FONT_REGULAR = "Inter"
if "InterBold" in pdfmetrics.getRegisteredFontNames():
    FONT_BOLD = "InterBold"


class GoldenDocTemplate(BaseDocTemplate):
    def __init__(self, filename):
        super().__init__(
            filename,
            pagesize=letter,
            rightMargin=0.65 * inch,
            leftMargin=0.65 * inch,
            topMargin=0.65 * inch,
            bottomMargin=0.65 * inch,
            title="Golden product and engineering handoff",
            author="Golden / Kayan Mishra",
            subject="Private beta handoff and Claude Code setup",
        )
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="body")
        self.addPageTemplates(PageTemplate(id="normal", frames=frame, onPage=self._page))

    def _page(self, canvas, doc):
        canvas.saveState()
        if doc.page == 1:
            canvas.setFillColor(INK)
            canvas.rect(0, 0, letter[0], letter[1], fill=1, stroke=0)
            canvas.setFillColor(GOLD)
            canvas.roundRect(0.65 * inch, letter[1] - 1.05 * inch, letter[0] - 1.3 * inch, 0.34 * inch, 12, fill=1, stroke=0)
        else:
            canvas.setStrokeColor(LINE)
            canvas.line(0.65 * inch, letter[1] - 0.48 * inch, letter[0] - 0.65 * inch, letter[1] - 0.48 * inch)
            canvas.setFont(FONT_BOLD, 9)
            canvas.setFillColor(INK)
            canvas.drawString(0.65 * inch, letter[1] - 0.36 * inch, "golden")
            canvas.setFont(FONT_REGULAR, 8)
            canvas.setFillColor(MUTED)
            canvas.drawRightString(letter[0] - 0.65 * inch, letter[1] - 0.36 * inch, "private beta handoff")
        canvas.setFont(FONT_REGULAR, 8)
        canvas.setFillColor(GOLD if doc.page == 1 else MUTED)
        canvas.drawRightString(letter[0] - 0.65 * inch, 0.35 * inch, str(doc.page))
        canvas.restoreState()


base = getSampleStyleSheet()
styles = {
    "cover_kicker": ParagraphStyle("cover_kicker", fontName=FONT_BOLD, fontSize=10, leading=13, textColor=GOLD, spaceAfter=16, uppercase=True),
    "cover_title": ParagraphStyle("cover_title", fontName=FONT_BOLD, fontSize=38, leading=40, textColor=colors.white, spaceAfter=18),
    "cover_body": ParagraphStyle("cover_body", fontName=FONT_REGULAR, fontSize=14, leading=21, textColor=colors.HexColor("#E9E7DF"), spaceAfter=18),
    "cover_link": ParagraphStyle("cover_link", fontName=FONT_BOLD, fontSize=10, leading=15, textColor=GOLD, spaceAfter=4),
    "h1": ParagraphStyle("h1", fontName=FONT_BOLD, fontSize=25, leading=29, textColor=INK, spaceBefore=2, spaceAfter=12),
    "h2": ParagraphStyle("h2", fontName=FONT_BOLD, fontSize=15, leading=19, textColor=INK, spaceBefore=13, spaceAfter=7),
    "body": ParagraphStyle("body", fontName=FONT_REGULAR, fontSize=10.4, leading=15.5, textColor=INK, spaceAfter=8),
    "small": ParagraphStyle("small", fontName=FONT_REGULAR, fontSize=8.8, leading=13, textColor=MUTED, spaceAfter=6),
    "bullet": ParagraphStyle("bullet", fontName=FONT_REGULAR, fontSize=10.2, leading=15, textColor=INK, leftIndent=13, firstLineIndent=-9, bulletIndent=0, spaceAfter=5),
    "code": ParagraphStyle("code", fontName=FONT_MONO, fontSize=8.7, leading=13, textColor=INK, backColor=colors.HexColor("#F0EFE9"), borderColor=LINE, borderWidth=0.7, borderPadding=9, spaceBefore=4, spaceAfter=10),
    "callout": ParagraphStyle("callout", fontName=FONT_BOLD, fontSize=10.2, leading=15, textColor=INK, backColor=GOLD, borderPadding=10, spaceBefore=7, spaceAfter=10),
    "prompt": ParagraphStyle("prompt", fontName=FONT_REGULAR, fontSize=9.3, leading=14, textColor=INK, backColor=colors.HexColor("#FFFBE0"), borderColor=AMBER, borderWidth=0.8, borderPadding=10, spaceBefore=5, spaceAfter=10),
}


def P(text, style="body"):
    return Paragraph(text, styles[style])


def bullet(text):
    return Paragraph("&#8226; " + text, styles["bullet"])


def section(title, body):
    return KeepTogether([P(title, "h2"), *body])


def qr_drawing(value, size=1.15 * inch):
    widget = qr.QrCodeWidget(value)
    x1, y1, x2, y2 = widget.getBounds()
    scale = min(size / (x2 - x1), size / (y2 - y1))
    drawing = Drawing(size, size, transform=[scale, 0, 0, scale, 0, 0])
    drawing.add(Rect(0, 0, x2 - x1, y2 - y1, fillColor=colors.white, strokeColor=colors.white))
    drawing.add(widget)
    return drawing


repo = "https://github.com/kayan-mudita/golden-house-beta"
site = "https://golden-house-beta.netlify.app/site.html"
app = "https://golden-house-beta.netlify.app/"
account = "https://golden-house-beta.netlify.app/?view=account"

story = []
story += [
    Spacer(1, 1.05 * inch),
    P("PRIVATE BETA · PRODUCT + ENGINEERING HANDOFF", "cover_kicker"),
    P("Golden is built.<br/>Here is how to take it forward.", "cover_title"),
    P("A working mobile-first app, public website, encrypted account backup, Supabase identity and Table paths, verified Stripe entitlement boundaries, installable offline shell, and a repository Claude Code can understand immediately.", "cover_body"),
    Spacer(1, 0.16 * inch),
]

link_table = Table(
    [
        [P(f'<link href="{repo}">GITHUB SOURCE</link>', "cover_link"), qr_drawing(repo)],
        [P(f'<link href="{site}">LIVE WEBSITE</link>', "cover_link"), ""],
        [P(f'<link href="{app}">LIVE APP</link>', "cover_link"), ""],
    ],
    colWidths=[5.25 * inch, 1.15 * inch],
)
link_table.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TEXTCOLOR", (0, 0), (-1, -1), GOLD),
    ("TOPPADDING", (0, 0), (-1, -1), 4),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
]))
story += [link_table, Spacer(1, 0.18 * inch), P("Prepared September 13, 2026", "cover_link"), PageBreak()]

story += [
    P("What exists now", "h1"),
    P("The supplied Golden prototype has been turned into one connected private-beta product. Its visual system, tone, eight-door structure, screen hierarchy, and public-site composition were preserved."),
    bullet("A mobile-first React app with onboarding, placement, resumable daily lessons, independent two-Door progress, earned-word review, Guide fallback and history controls, a server-backed six-seat Table path, plans, gifts, reminders, settings, and account recovery."),
    bullet("A public website whose calls to action and door cards open the current app and preserve the selected context."),
    bullet("An installable progressive web app with a service worker, manifest, repeat-launch cache, and offline shell."),
    bullet("Anonymous device accounts with opt-in encrypted server backup and portable recovery files."),
    bullet("A normalized eight-door curriculum catalog that distinguishes complete manuscripts from mapped outlines."),
    bullet("A Netlify production deployment with same-origin Guide and encrypted-state functions."),
    P("Open it", "h2"),
]

open_table = Table([
    [P("Website", "small"), P(f'<link href="{site}">{site}</link>', "body")],
    [P("App", "small"), P(f'<link href="{app}">{app}</link>', "body")],
    [P("Account", "small"), P(f'<link href="{account}">{account}</link>', "body")],
    [P("GitHub", "small"), P(f'<link href="{repo}">{repo}</link>', "body")],
], colWidths=[0.85 * inch, 5.9 * inch])
open_table.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LINEBELOW", (0, 0), (-1, -1), 0.4, LINE),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))
story += [open_table, PageBreak()]

story += [
    P("Connect Claude Code", "h1"),
    P("The repository is private. Kayan first adds your GitHub username as a collaborator at:"),
    P('<link href="https://github.com/kayan-mudita/golden-house-beta/settings/access">github.com/kayan-mudita/golden-house-beta/settings/access</link>', "callout"),
    P("Accept the GitHub invitation. Install Git, Node.js 20 or newer, and Claude Code. Then run:"),
    P("git clone https://github.com/kayan-mudita/golden-house-beta.git<br/>cd golden-house-beta<br/>npm install<br/>npm run dev", "code"),
    P("Open http://localhost:5173/ for the app and http://localhost:5173/site.html for the website. Start Claude Code inside the repository:"),
    P("claude", "code"),
    P("Give Claude this first message", "h2"),
    P("Read CLAUDE.md, README.md, docs/PRODUCT_SPEC.md, docs/WAYFINDER.md, and docs/CONTENT_RELEASE.md. Then inspect the current app and tests. Preserve the supplied Golden visual language and structure. Tell me what is live, what is still a private-beta preview, and the smallest safe next milestone before editing anything.", "prompt"),
    P("Claude Code automatically finds the root CLAUDE.md. It contains the commands, architecture, product constraints, privacy boundary, and content-release rules.", "small"),
    PageBreak(),
]

story += [
    P("How the system fits together", "h1"),
]
architecture = Table([
    [P("SURFACE", "small"), P("RESPONSIBILITY", "small")],
    [P("src/Golden.jsx", "body"), P("The preserved mobile app and product journey.", "body")],
    [P("public/site.html", "body"), P("The supplied public website. It opens the current app in an iframe.", "body")],
    [P("src/content/catalog.js", "body"), P("The normalized curriculum, provenance, review state, and preview gates.", "body")],
    [P("src/platform/", "body"), P("Anonymous accounts, Supabase identity, Table and gift repositories, snapshots, Web Crypto, recovery files, and sync calls.", "body")],
    [P("api/", "body"), P("Encrypted state, hardened Guide, authenticated Table and gift routes, and server-owned Stripe Checkout and webhook handlers. Local state uses SQLite/libSQL.", "body")],
    [P("netlify/functions/", "body"), P("Thin production adapters. Netlify stores encrypted records in private Blobs.", "body")],
    [P("supabase/", "body"), P("Undeployed authenticated data, Table, content, gift, and entitlement contract with RLS.", "body")],
    [P("public/sw.js", "body"), P("Offline shell and safe caching. API responses are never cached.", "body")],
], colWidths=[1.75 * inch, 5 * inch], repeatRows=1)
architecture.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), INK),
    ("TEXTCOLOR", (0, 0), (-1, 0), GOLD),
    ("GRID", (0, 0), (-1, -1), 0.45, LINE),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("TOPPADDING", (0, 0), (-1, -1), 7),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ("LEFTPADDING", (0, 0), (-1, -1), 7),
    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
]))
story += [architecture, Spacer(1, 0.18 * inch)]
story.append(section("Privacy and recovery boundary", [
    P("The browser encrypts the complete snapshot with AES-GCM before upload. The backend stores ciphertext, an initialization vector, timestamps, and a hash of the recovery credential. The normal upload never contains the raw recovery credential."),
    P("The recovery file can contain that credential and must be treated like a password. Do not log authorization headers, recovery credentials, decrypted snapshots, selected doors, practice history, or Guide questions.", "callout"),
]))
story += [PageBreak()]

story += [
    P("What is real, and what is still a preview", "h1"),
    P("The software foundation is live. External partnerships and public-release claims are intentionally gated."),
    P("Proven", "h2"),
    bullet("The website opens the app with door and screen context."),
    bullet("Production state storage completed an encrypted write and read, returned the identical envelope, and rejected an incorrect credential."),
    bullet("One hundred fifty-seven unit, content, backend, feature-domain, adapter, and PWA checks pass, plus twenty-nine end-to-end checks."),
    bullet("The dependency audit reports zero known vulnerabilities."),
    bullet("The Guide provides a clearly labeled lesson-text fallback when no AI key is configured."),
    P("Content status", "h2"),
    P("The catalog maps 2,648 curriculum slots across eight doors. Twenty-nine supplied manuscripts are previewable: Hinduism days 1-21, Christianity days 1-7, and Islam day 1. The remaining 2,619 slots are mapped outlines. Fifteen practice scripts need revision against the current sit ladder."),
    P("No lesson is cleared for public release. Keeper approval, voice participation, and recording rights are pending.", "callout"),
    P("Still preview-only", "h2"),
    P("Supabase identity, Table creation and invitations, privacy-safe shared attendance, Stripe checkout, verified webhook entitlements, and gift purchase and claim state are implemented. The live beta still needs a selected Golden Supabase project, applied migrations, Netlify environment variables, Stripe products and webhook secrets, and a delivery provider. Scheduled notification delivery, email delivery, live community counts, events, celebrity recordings, and signed Keeper participation also remain unconnected. The software reports these provider boundaries directly."),
    PageBreak(),
]

story += [
    P("The recommended next milestone", "h1"),
    P("Run a small private content pilot with the 29 supplied drafts. Clear one door as an honest vertical slice before connecting acquisition or commerce."),
    bullet("Complete Keeper review for one door and record evidence against the exact content revision."),
    bullet("Resolve voice participation and recording rights, or choose an approved house-voice path."),
    bullet("Revise the stale practice scripts in that door."),
    bullet("Test onboarding, one complete lesson, progress, encrypted backup, recovery on a second device, and offline launch with invited adults."),
    bullet("Only then decide whether the next integration is Guide, payments, family accounts, events, or email."),
    P("Working agreement", "h2"),
    P("Treat the supplied product as the visual source of truth. Use GitHub issues and pull requests for changes. Never place API keys in browser code. Do not expose belief or practice data in logs or analytics. Keep the repository private until content, voice, legal, privacy, and safety decisions are complete."),
    HRFlowable(width="100%", thickness=0.8, color=LINE, spaceBefore=16, spaceAfter=14),
    P("Repository", "h2"),
    P(f'<link href="{repo}">{repo}</link>', "callout"),
    P("The repository also contains UNCLE_HANDOFF.md with this information in plain text, allowing Claude and other tools to ingest the handoff without relying on PDF layout extraction.", "small"),
]

doc = GoldenDocTemplate(str(OUTPUT))
doc.build(story)
print(OUTPUT)
