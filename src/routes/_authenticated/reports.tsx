import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, FileText, Calendar } from "lucide-react";
import { QUARTERS, type Crop } from "@/lib/calculations";
import { generateAnnualReport, generateQuarterReport } from "@/lib/pdf";

export const Route = createFileRoute("/_authenticated/reports")({
  component: Reports,
});

function Reports() {
  const { user } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear());
  const [quarter, setQuarter] = useState(1);

  const { data: crops = [] } = useQuery({
    queryKey: ["report-crops", user?.id, year],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("crops").select("*").eq("year", year);
      if (error) throw error;
      return data as Crop[];
    },
  });
  const { data: profile } = useQuery({
    queryKey: ["profile-report", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      return data;
    },
  });

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground">Generate downloadable PDF reports</p>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-muted-foreground">Year</label>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>{years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 items-stretch">
        <Card className="flex flex-col h-full">
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
              <Calendar className="h-5 w-5" />
            </div>
            <CardTitle>Quarter Report</CardTitle>
            <CardDescription>One quarter summary with all crops.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 justify-between gap-3">
            <Select value={String(quarter)} onValueChange={(v) => setQuarter(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {QUARTERS.map((q) => <SelectItem key={q.id} value={String(q.id)}>{q.label} ({q.range})</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              className="w-full mt-auto"
              onClick={() => generateQuarterReport(quarter, year, crops.filter((c) => c.quarter === quarter), profile ?? undefined)}
            >
              <FileDown className="h-4 w-4 mr-2" /> Download Quarter PDF
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-full">
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
              <FileText className="h-5 w-5" />
            </div>
            <CardTitle>Annual Report</CardTitle>
            <CardDescription>Full year breakdown across all four quarters.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 justify-between gap-3">
            <div className="rounded-md border border-dashed border-muted-foreground/20 px-3 py-2 text-xs text-muted-foreground">
              Covers all 4 quarters of {year}
            </div>
            <Button className="w-full" onClick={() => generateAnnualReport(year, crops, profile ?? undefined)}>
              <FileDown className="h-4 w-4 mr-2" /> Download Annual PDF
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crop reports</CardTitle>
          <CardDescription>Single-crop reports are available from the Crops page.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
