import type { Tables } from "@/integrations/supabase/types";

export type Crop = Tables<"crops">;

export const QUARTERS = [
  { id: 1, label: "Q1", range: "Jan - Mar" },
  { id: 2, label: "Q2", range: "Apr - Jun" },
  { id: 3, label: "Q3", range: "Jul - Sep" },
  { id: 4, label: "Q4", range: "Oct - Dec" },
] as const;

export const INVESTMENT_KEYS = [
  "inv_seeds",
  "inv_fertilizer",
  "inv_labor",
  "inv_irrigation",
  "inv_pesticide",
  "inv_equipment",
  "inv_other",
] as const;

export const INVESTMENT_LABELS: Record<(typeof INVESTMENT_KEYS)[number], string> = {
  inv_seeds: "Seeds",
  inv_fertilizer: "Fertilizer",
  inv_labor: "Labor",
  inv_irrigation: "Irrigation",
  inv_pesticide: "Pesticide",
  inv_equipment: "Equipment",
  inv_other: "Other",
};

export const totalInvestment = (c: Crop) =>
  INVESTMENT_KEYS.reduce((sum, k) => sum + Number(c[k] || 0), 0);

export const totalReturns = (c: Crop) =>
  Number(c.total_selling) || Number(c.quantity_harvested) * Number(c.market_rate);

export const profit = (c: Crop) => totalReturns(c) - totalInvestment(c);

export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);

export const summarize = (crops: Crop[]) => {
  const investment = crops.reduce((s, c) => s + totalInvestment(c), 0);
  const returns = crops.reduce((s, c) => s + totalReturns(c), 0);
  const net = returns - investment;
  let best: { name: string; profit: number } | null = null;
  for (const c of crops) {
    const p = profit(c);
    if (!best || p > best.profit) best = { name: c.crop_name, profit: p };
  }
  return { investment, returns, net, best };
};
export const generateInsights = (crops: Crop[]) => {
  const insights: string[] = [];

  if (!crops.length) return insights;

  const profitable = [...crops].sort(
    (a, b) => profit(b) - profit(a)
  );

  const best = profitable[0];

  if (best && profit(best) > 0) {
    insights.push(
      `${best.crop_name} generated the highest profit of ${inr(
        profit(best)
      )}.`
    );
  }

  const highFertilizer = crops.find(
    (c) => Number(c.inv_fertilizer) > totalInvestment(c) * 0.4
  );

  if (highFertilizer) {
    insights.push(
      `Fertilizer cost is unusually high in ${highFertilizer.crop_name}.`
    );
  }

  const losses = crops.filter((c) => profit(c) < 0);

  if (losses.length > 0) {
    insights.push(
      `${losses.length} crop(s) are currently running at a loss.`
    );
  }

  const bestROI = profitable.sort(
    (a, b) =>
      profit(b) / totalInvestment(b) -
      profit(a) / totalInvestment(a)
  )[0];

  if (bestROI) {
    insights.push(
      `${bestROI.crop_name} has the best return on investment this quarter.`
    );
  }

  return insights;
};