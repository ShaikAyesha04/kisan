import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { INVESTMENT_KEYS, INVESTMENT_LABELS, QUARTERS, inr, profit, totalInvestment, totalReturns, type Crop } from "./calculations";

interface ProfileLite {
  name?: string | null;
  village?: string | null;
  district?: string | null;
}

function header(doc: jsPDF, title: string, profile?: ProfileLite) {
  doc.setFillColor(34, 139, 75);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 28, "F");
  doc.setTextColor(255);
  doc.setFontSize(18);
  doc.text("Kisan Track", 14, 18);
  doc.setFontSize(11);
  doc.text(title, doc.internal.pageSize.getWidth() - 14, 18, { align: "right" });
  doc.setTextColor(40);
  if (profile) {
    doc.setFontSize(10);
    doc.text(
      `Farmer: ${profile.name ?? ""}    ${profile.village ?? ""}${profile.district ? ", " + profile.district : ""}`,
      14,
      38,
    );
  }
}

function summarySection(doc: jsPDF, crops: Crop[], y: number) {
  const inv = crops.reduce((s, c) => s + totalInvestment(c), 0);
  const ret = crops.reduce((s, c) => s + totalReturns(c), 0);
  const net = ret - inv;
  autoTable(doc, {
    startY: y,
    head: [["Total Investment", "Total Returns", "Net Profit/Loss"]],
    body: [[inr(inv), inr(ret), inr(net)]],
    theme: "grid",
    headStyles: { fillColor: [34, 139, 75] },
  });
}

function cropTable(doc: jsPDF, crops: Crop[], y: number) {
  autoTable(doc, {
    startY: y,
    head: [["Crop", "Quarter", "Land", "Investment", "Returns", "Profit"]],
    body: crops.map((c) => [
      c.crop_name,
      `Q${c.quarter}`,
      `${c.land_area} ac`,
      inr(totalInvestment(c)),
      inr(totalReturns(c)),
      inr(profit(c)),
    ]),
    theme: "striped",
    headStyles: { fillColor: [34, 139, 75] },
  });
}

export function generateQuarterReport(quarter: number, year: number, crops: Crop[], profile?: ProfileLite) {
  const doc = new jsPDF();
  const q = QUARTERS.find((x) => x.id === quarter)!;
  header(doc, `${q.label} ${year} Report (${q.range})`, profile);
  summarySection(doc, crops, 46);
  cropTable(doc, crops, (doc as any).lastAutoTable.finalY + 8);
  doc.save(`KisanTrack_${q.label}_${year}.pdf`);
}

export function generateAnnualReport(year: number, crops: Crop[], profile?: ProfileLite) {
  const doc = new jsPDF();
  header(doc, `Annual Report ${year}`, profile);
  summarySection(doc, crops, 46);
  let y = (doc as any).lastAutoTable.finalY + 8;
  for (const q of QUARTERS) {
    const qc = crops.filter((c) => c.quarter === q.id);
    if (qc.length === 0) continue;
    doc.setFontSize(13);
    doc.text(`${q.label} — ${q.range}`, 14, y);
    cropTable(doc, qc, y + 4);
    y = (doc as any).lastAutoTable.finalY + 10;
    if (y > 250) { doc.addPage(); y = 20; }
  }
  doc.save(`KisanTrack_Annual_${year}.pdf`);
}

export function generateCropReport(crop: Crop, profile?: ProfileLite) {
  const doc = new jsPDF();
  header(doc, `Crop Report — ${crop.crop_name}`, profile);
  autoTable(doc, {
    startY: 46,
    head: [["Field", "Value"]],
    body: [
      ["Quarter", `Q${crop.quarter} (${crop.year})`],
      ["Sowing month", crop.sowing_month ?? "-"],
      ["Harvest month", crop.harvest_month ?? "-"],
      ["Land area", `${crop.land_area} acres`],
      ["Quantity harvested", String(crop.quantity_harvested)],
      ["Market rate", inr(Number(crop.market_rate))],
      ["Total selling", inr(totalReturns(crop))],
    ],
    theme: "grid",
    headStyles: { fillColor: [34, 139, 75] },
  });
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 8,
    head: [["Investment Category", "Amount"]],
    body: [
      ...INVESTMENT_KEYS.map((k) => [INVESTMENT_LABELS[k], inr(Number(crop[k]))]),
      ["Total Investment", inr(totalInvestment(crop))],
      ["Total Returns", inr(totalReturns(crop))],
      ["Profit / Loss", inr(profit(crop))],
    ],
    theme: "striped",
    headStyles: { fillColor: [34, 139, 75] },
  });
  doc.save(`KisanTrack_${crop.crop_name}_Q${crop.quarter}.pdf`);
}
