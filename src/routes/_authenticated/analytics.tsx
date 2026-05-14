import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import { INVESTMENT_KEYS, INVESTMENT_LABELS, QUARTERS, profit, totalInvestment, totalReturns, type Crop } from "@/lib/calculations";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: Analytics,
});

const COLORS = ["hsl(var(--chart-1, 145 60% 45%))", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16"];

function Analytics() {
  const { user } = useAuth();
  const year = new Date().getFullYear();
  const { data: crops = [] } = useQuery({
    queryKey: ["crops-analytics", user?.id, year],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("crops").select("*").eq("year", year);
      if (error) throw error;
      return data as Crop[];
    },
  });

  const quarterData = QUARTERS.map((q) => {
    const qc = crops.filter((c) => c.quarter === q.id);
    return {
      quarter: q.label,
      Investment: qc.reduce((s, c) => s + totalInvestment(c), 0),
      Returns: qc.reduce((s, c) => s + totalReturns(c), 0),
      Profit: qc.reduce((s, c) => s + profit(c), 0),
    };
  });

  const expenseData = INVESTMENT_KEYS.map((k) => ({
    name: INVESTMENT_LABELS[k],
    value: crops.reduce((s, c) => s + Number(c[k] || 0), 0),
  })).filter((e) => e.value > 0);

  const cropData = crops.map((c) => ({
    name: c.crop_name,
    Investment: totalInvestment(c),
    Returns: totalReturns(c),
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Visual insights for {year}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Investment vs Returns by Quarter</CardTitle></CardHeader>
          <CardContent style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quarterData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="quarter" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="Investment" fill="hsl(40 90% 55%)" radius={[6,6,0,0]} />
                <Bar dataKey="Returns" fill="hsl(145 55% 45%)" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Expense Breakdown</CardTitle></CardHeader>
          <CardContent style={{ height: 320 }}>
            {expenseData.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center pt-12">No expense data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseData} dataKey="value" nameKey="name" outerRadius={100} label>
                    {expenseData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Profit Trend by Quarter</CardTitle></CardHeader>
          <CardContent style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={quarterData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="quarter" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="Profit" stroke="hsl(145 55% 45%)" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {cropData.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Per-Crop Investment vs Returns</CardTitle></CardHeader>
            <CardContent style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cropData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="Investment" fill="hsl(40 90% 55%)" radius={[6,6,0,0]} />
                  <Bar dataKey="Returns" fill="hsl(145 55% 45%)" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
