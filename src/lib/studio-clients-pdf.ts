import jsPDF from "jspdf";

export type StudioClientPdfRow = {
  clientEmail: string;
  clientUserId: string;
  linkedAt: Date;
  clientCreatedAt: Date;
  identityCount: number;
};

export type StudioClientsPdfSummary = {
  pendingInvites: number;
  invitesCreatedLast30Days: number;
  invitesAcceptedLast30Days: number;
  acceptanceRateLast30Days: number | null;
  totalIdentities: number;
};

export type StudioClientsPdfParams = {
  studioEmail: string;
  generatedAt: Date;
  clients: StudioClientPdfRow[];
  summary: StudioClientsPdfSummary;
};

const BDX = {
  dark: [69, 13, 36] as [number, number, number],
  mid: [122, 21, 40] as [number, number, number],
  lightBg: [252, 232, 236] as [number, number, number],
  muted: [92, 17, 32] as [number, number, number],
};

const NEU = {
  white: [255, 255, 255] as [number, number, number],
  paper: [253, 252, 251] as [number, number, number],
  border: [231, 220, 223] as [number, number, number],
  text: [41, 37, 36] as [number, number, number],
  sub: [87, 83, 78] as [number, number, number],
};

const PAGE_W = 210;
const PAGE_H = 297;
const M = 18;
const CW = PAGE_W - M * 2;
const ROW_H = 8.5;
const HEADER_ROW_H = 10;

function fmtShort(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtRate(v: number | null): string {
  if (v === null) return "—";
  return `${v} %`;
}

function drawKpiCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
) {
  doc.setFillColor(...NEU.white);
  doc.setDrawColor(...BDX.lightBg);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, w, h, 2, 2, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...BDX.muted);
  doc.text(label, x + 4, y + 5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BDX.dark);
  doc.text(value, x + 4, y + h - 4);
}

/** Génère un PDF « rapport espace commercial » (buffer binaire pour réponse HTTP). */
export function buildStudioClientsPdfBuffer(params: StudioClientsPdfParams): ArrayBuffer {
  const { studioEmail, generatedAt, clients, summary } = params;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  let y = 0;

  // ——— Bandeau ———
  doc.setFillColor(...BDX.dark);
  doc.rect(0, 0, PAGE_W, 52, "F");
  doc.setFillColor(...BDX.mid);
  doc.rect(0, 52, PAGE_W, 1.2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...NEU.white);
  doc.text("Rapport clients — espace commercial", M, 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(220, 200, 208);
  const sub = `Espace Faymoos · Partenaire : ${studioEmail}`;
  const subLines = doc.splitTextToSize(sub, CW);
  doc.text(subLines, M, 31);

  doc.setFontSize(8);
  doc.setTextColor(180, 160, 170);
  doc.text(
    `Document généré le ${generatedAt.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}`,
    M,
    44,
  );

  y = 62;

  // ——— Résumé KPI ———
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BDX.dark);
  doc.text("Synthèse", M, y);
  y += 6;

  const gap = 4;
  const cardW = (CW - gap * 3) / 4;
  const cardH = 22;
  const row1y = y;
  drawKpiCard(doc, M, row1y, cardW, cardH, "Clients liés", String(clients.length));
  drawKpiCard(doc, M + cardW + gap, row1y, cardW, cardH, "Identités (total)", String(summary.totalIdentities));
  drawKpiCard(doc, M + (cardW + gap) * 2, row1y, cardW, cardH, "Invit. en attente", String(summary.pendingInvites));
  drawKpiCard(
    doc,
    M + (cardW + gap) * 3,
    row1y,
    cardW,
    cardH,
    "Taux accept. (30 j.)",
    fmtRate(summary.acceptanceRateLast30Days),
  );

  y = row1y + cardH + 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...NEU.sub);
  const cohort =
    summary.invitesCreatedLast30Days === 0
      ? "Aucune invitation émise sur les 30 derniers jours."
      : `${summary.invitesAcceptedLast30Days} acceptation(s) sur ${summary.invitesCreatedLast30Days} invitation(s) émises (fenêtre 30 j.).`;
  doc.text(cohort, M, y);
  y += 10;

  // ——— Tableau ———
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BDX.dark);
  doc.text("Clients rattachés", M, y);
  y += 8;

  const col = {
    email: M,
    linked: M + 72,
    created: M + 108,
    idents: M + 146,
    uuid: M + 158,
  };

  function drawTableHeader(yy: number) {
    doc.setFillColor(...BDX.lightBg);
    doc.rect(M, yy, CW, HEADER_ROW_H, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...BDX.dark);
    doc.text("E-mail client", col.email + 2, yy + 6.5);
    doc.text("Lié le", col.linked + 1, yy + 6.5);
    doc.text("Compte créé", col.created + 1, yy + 6.5);
    doc.text("Id.", col.idents + 1, yy + 6.5);
    doc.text("ID client (extrait)", col.uuid + 1, yy + 6.5);
  }

  function drawFooter() {
    doc.setDrawColor(...NEU.border);
    doc.setLineWidth(0.2);
    doc.line(M, PAGE_H - 18, PAGE_W - M, PAGE_H - 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...NEU.sub);
    doc.text("Faymoos · Export confidentiel · Usage interne (espace commercial)", M, PAGE_H - 12);
    doc.text("Les dates d’export sont en heure locale du serveur d’export.", M, PAGE_H - 8);
  }

  drawTableHeader(y);
  y += HEADER_ROW_H;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  let rowIndex = 0;
  for (const row of clients) {
    if (y + ROW_H > PAGE_H - 28) {
      drawFooter();
      doc.addPage();
      doc.setFillColor(...NEU.paper);
      doc.rect(0, 0, PAGE_W, PAGE_H, "F");
      y = M;
      drawTableHeader(y);
      y += HEADER_ROW_H;
    }

    if (rowIndex % 2 === 0) {
      doc.setFillColor(249, 247, 247);
      doc.rect(M, y, CW, ROW_H, "F");
    }
    doc.setDrawColor(...NEU.border);
    doc.line(M, y + ROW_H, M + CW, y + ROW_H);

    doc.setTextColor(...NEU.text);
    const emailShort =
      row.clientEmail.length > 38 ? `${row.clientEmail.slice(0, 35)}…` : row.clientEmail;
    doc.text(emailShort, col.email + 2, y + 5.5);
    doc.text(fmtShort(row.linkedAt), col.linked + 1, y + 5.5);
    doc.text(fmtShort(row.clientCreatedAt), col.created + 1, y + 5.5);
    doc.text(String(row.identityCount), col.idents + 1, y + 5.5);
    doc.setTextColor(...NEU.sub);
    doc.setFontSize(7);
    const shortId = `${row.clientUserId.slice(0, 8)}…`;
    doc.text(shortId, col.uuid + 1, y + 5.5);
    doc.setFontSize(8);

    y += ROW_H;
    rowIndex += 1;
  }

  if (clients.length === 0) {
    doc.setTextColor(...NEU.sub);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text("Aucun client lié pour le moment.", M + 2, y + 6);
    y += ROW_H + 4;
    doc.setFont("helvetica", "normal");
  }

  drawFooter();

  return doc.output("arraybuffer") as ArrayBuffer;
}
