import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, TrendingDown, Wallet, Trophy, Wheat, Edit2, Trash2 } from "lucide-react";
import { CropDialog } from "@/components/CropDialog";
import { QUARTERS, inr, profit, summarize, totalInvestment, totalReturns, type Crop,generateInsights } from "@/lib/calculations";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const [year] = useState(new Date().getFullYear());
  const [quarter, setQuarter] = useState(Math.floor(new Date().getMonth() / 3) + 1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Crop | null>(null);

  const { data: crops = [], refetch, isLoading } = useQuery({
    queryKey: ["crops", user?.id, year],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("crops").select("*").eq("year", year).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Crop[];
    },
  });

  const yearStats = summarize(crops);
  const qCrops = crops.filter((c) => c.quarter === quarter);
  const insights = generateInsights(qCrops);
  const remove = async (id: string) => {
    if (!confirm("Delete this crop?")) return;
    const { error } = await supabase.from("crops").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Crop deleted");
    refetch();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Year {year} overview</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Crop
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Wallet} label="Total Investment" value={inr(yearStats.investment)} tone="muted" />
        <StatCard icon={TrendingUp} label="Total Returns" value={inr(yearStats.returns)} tone="primary" />
        <StatCard
          icon={yearStats.net >= 0 ? TrendingUp : TrendingDown}
          label={yearStats.net >= 0 ? "Net Profit" : "Net Loss"}
          value={inr(Math.abs(yearStats.net))}
          tone={yearStats.net >= 0 ? "success" : "destructive"}
        />
        <StatCard
          icon={Trophy}
          label="Best Crop"
          value={yearStats.best?.name ?? "—"}
          sub={yearStats.best ? inr(yearStats.best.profit) : undefined}
          tone="accent"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quarter view</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={String(quarter)} onValueChange={(v) => setQuarter(Number(v))}>
            <TabsList className="grid grid-cols-4 w-full sm:w-auto">
              {QUARTERS.map((q) => (
                <TabsTrigger key={q.id} value={String(q.id)}>
                  <div className="flex flex-col">
                    <span className="font-semibold">{q.label}</span>
                    <span className="text-[10px] text-muted-foreground">{q.range}</span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
            {QUARTERS.map((q) => (
              <TabsContent key={q.id} value={String(q.id)} className="mt-4">
                {isLoading ? (
                  <div className="text-muted-foreground text-sm py-8 text-center">Loading...</div>
                ) : qCrops.length === 0 ? (
                  <div className="border-2 border-dashed rounded-xl py-12 text-center">
                    <Wheat className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No crops in {q.label} yet.</p>
                    <Button className="mt-4" onClick={() => { setEditing(null); setDialogOpen(true); }}>
                      <Plus className="h-4 w-4 mr-1" /> Add first crop
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {qCrops.map((c) => {
                      const p = profit(c);
                      return (
                        <div key={c.id} className="rounded-lg border bg-card p-4 flex flex-wrap items-center gap-4 justify-between hover:border-primary/40 transition">
                          <div className="flex items-center gap-3 min-w-0">
                           <div className="h-12 w-12 rounded-lg overflow-hidden border bg-muted">
  {(c as any).image_url ? (
    <img
      src={(c as any).image_url}
      alt={c.crop_name}
      className="h-full w-full object-cover"
    />
  ) : (
    <div className="flex items-center justify-center h-full bg-primary/10 text-primary">
      <Wheat className="h-5 w-5" />
    </div>
  )}
</div>
                            <div className="min-w-0">
                              <div className="font-semibold truncate">{c.crop_name}</div>
                              <div className="text-xs text-muted-foreground">{c.land_area} ac · {c.sowing_month || "?"} → {c.harvest_month || "?"}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-sm">
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground">Invest</div>
                              <div className="font-medium">{inr(totalInvestment(c))}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground">Return</div>
                              <div className="font-medium">{inr(totalReturns(c))}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground">P/L</div>
                              <div className={`font-semibold ${p >= 0 ? "text-success" : "text-destructive"}`}>{inr(p)}</div>
                            </div>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setDialogOpen(true); }}><Edit2 className="h-4 w-4" /></Button>
                              <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <CropDialog open={dialogOpen} onOpenChange={setDialogOpen} crop={editing} defaultQuarter={quarter} onSaved={refetch} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, tone }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; sub?: string;
  tone: "primary" | "muted" | "success" | "destructive" | "accent";
}) {
  const toneMap = {
    primary: "bg-primary/10 text-primary",
    muted: "bg-muted text-muted-foreground",
    success: "bg-success/15 text-success",
    destructive: "bg-destructive/10 text-destructive",
    accent: "bg-accent/30 text-accent-foreground",
  };
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneMap[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
