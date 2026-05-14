import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Trash2, Wheat, Search, FileDown } from "lucide-react";
import { CropDialog } from "@/components/CropDialog";
import { inr, profit, totalInvestment, totalReturns, type Crop } from "@/lib/calculations";
import { generateCropReport } from "@/lib/pdf";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/crops")({
  component: CropsPage,
});

function CropsPage() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Crop | null>(null);
  const [search, setSearch] = useState("");

  const { data: crops = [], refetch, isLoading } = useQuery({
    queryKey: ["all-crops", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("crops").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Crop[];
    },
  });
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      return data;
    },
  });

  const filtered = crops.filter((c) => c.crop_name.toLowerCase().includes(search.toLowerCase()));

  const remove = async (id: string) => {
    if (!confirm("Delete this crop?")) return;
    const { error } = await supabase.from("crops").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    refetch();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Crops</h1>
          <p className="text-sm text-muted-foreground">Manage all your crops</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Crop
        </Button>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle>All crops</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground py-8 text-center">Loading...</p>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed rounded-xl">
              <Wheat className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No crops found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 px-2 font-medium">Crop</th>
                    <th className="py-2 px-2 font-medium">Q/Year</th>
                    <th className="py-2 px-2 font-medium">Land</th>
                    <th className="py-2 px-2 font-medium text-right">Investment</th>
                    <th className="py-2 px-2 font-medium text-right">Returns</th>
                    <th className="py-2 px-2 font-medium text-right">Profit</th>
                    <th className="py-2 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const p = profit(c);
                    return (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-muted/40">
                        <td className="py-3 px-2 font-medium">{c.crop_name}</td>
                        <td className="py-3 px-2 text-muted-foreground">Q{c.quarter} · {c.year}</td>
                        <td className="py-3 px-2 text-muted-foreground">{c.land_area} ac</td>
                        <td className="py-3 px-2 text-right">{inr(totalInvestment(c))}</td>
                        <td className="py-3 px-2 text-right">{inr(totalReturns(c))}</td>
                        <td className={`py-3 px-2 text-right font-semibold ${p >= 0 ? "text-success" : "text-destructive"}`}>{inr(p)}</td>
                        <td className="py-3 px-2">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => generateCropReport(c, profile ?? undefined)}><FileDown className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}><Edit2 className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <CropDialog open={open} onOpenChange={setOpen} crop={editing} onSaved={refetch} />
    </div>
  );
}
