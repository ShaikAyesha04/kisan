import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { INVESTMENT_KEYS, INVESTMENT_LABELS, type Crop, QUARTERS } from "@/lib/calculations";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  crop?: Crop | null;
  defaultQuarter?: number;
  onSaved?: () => void;
}

const blank = {
  crop_name: "",
  sowing_month: "",
  harvest_month: "",
  land_area: 0,
  quarter: 1,
  inv_seeds: 0, inv_fertilizer: 0, inv_labor: 0, inv_irrigation: 0,
  inv_pesticide: 0, inv_equipment: 0, inv_other: 0,
  quantity_harvested: 0, market_rate: 0, total_selling: 0,
  notes: "",
  image_url: "",
};

export function CropDialog({ open, onOpenChange, crop, defaultQuarter, onSaved }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState<typeof blank>(blank);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    if (crop) {
      setForm({
        crop_name: crop.crop_name,
        sowing_month: crop.sowing_month ?? "",
        harvest_month: crop.harvest_month ?? "",
        land_area: Number(crop.land_area),
        quarter: crop.quarter,
        inv_seeds: Number(crop.inv_seeds), inv_fertilizer: Number(crop.inv_fertilizer),
        inv_labor: Number(crop.inv_labor), inv_irrigation: Number(crop.inv_irrigation),
        inv_pesticide: Number(crop.inv_pesticide), inv_equipment: Number(crop.inv_equipment),
        inv_other: Number(crop.inv_other),
        quantity_harvested: Number(crop.quantity_harvested),
        market_rate: Number(crop.market_rate),
        total_selling: Number(crop.total_selling),
        notes: crop.notes ?? "",
        image_url: (crop as any).image_url ?? "",
      });
    } else {
      setForm({ ...blank, quarter: defaultQuarter ?? 1 });
    }
  }, [crop, defaultQuarter, open]);

  const set = <K extends keyof typeof blank>(k: K, v: (typeof blank)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const autoSelling = form.quantity_harvested * form.market_rate;
  const totalInv = INVESTMENT_KEYS.reduce((s, k) => s + Number(form[k] || 0), 0);
  const finalSelling = form.total_selling > 0 ? form.total_selling : autoSelling;
  const netProfit = finalSelling - totalInv;
  const margin = finalSelling > 0 ? (netProfit / finalSelling) * 100 : 0;
  const fmt = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
const uploadImage = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0];

  if (!file) return;

  setUploading(true);

  const fileExt = file.name.split(".").pop();

  const fileName = `${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from("crop-images")
    .upload(fileName, file);

  if (error) {
    toast.error(error.message);
    setUploading(false);
    return;
  }

  const {
    data: { publicUrl },
  } = supabase.storage
    .from("crop-images")
    .getPublicUrl(fileName);

  set("image_url" as any, publicUrl);

  toast.success("Image uploaded");

  setUploading(false);
};
  const submit = async () => {
    if (!user) return;
    if (!form.crop_name.trim()) {
      toast.error("Crop name is required");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      total_selling: form.quantity_harvested * form.market_rate,
      user_id: user.id,
      image_url: form.image_url,
    };
    const res = crop
      ? await supabase.from("crops").update(payload).eq("id", crop.id)
      : await supabase.from("crops").insert(payload);
    setSaving(false);
    if (res.error) {
      toast.error(res.error.message);
      return;
    }
    toast.success(crop ? "Crop updated" : "Crop added");
    onSaved?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{crop ? "Edit Crop" : "Add Crop"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Crop name</Label>
              <Input value={form.crop_name} onChange={(e) => set("crop_name", e.target.value)} placeholder="e.g. Wheat" />
            </div>
            <div>
              <Label>Quarter</Label>
              <Select value={String(form.quarter)} onValueChange={(v) => set("quarter", Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {QUARTERS.map((q) => (
                    <SelectItem key={q.id} value={String(q.id)}>{q.label} ({q.range})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sowing month</Label>
              <Select value={form.sowing_month} onValueChange={(v) => set("sowing_month", v)}>
                <SelectTrigger><SelectValue placeholder="Select month" /></SelectTrigger>
                <SelectContent>{MONTHS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Harvest month</Label>
              <Select value={form.harvest_month} onValueChange={(v) => set("harvest_month", v)}>
                <SelectTrigger><SelectValue placeholder="Select month" /></SelectTrigger>
                <SelectContent>{MONTHS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Land area (acres)</Label>
              <Input type="number" min="0" step="0.01" value={form.land_area} onChange={(e) => set("land_area", Number(e.target.value))} />
              </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

  

  <div className="sm:col-span-2">
    <Label>Land area (acres)</Label>
    
  </div>

  <div className="sm:col-span-2">
    <Label>Crop Image</Label>

    <Input
      type="file"
      accept="image/*"
      onChange={uploadImage}
    />

    {uploading && (
      <p className="text-sm text-muted-foreground mt-2">
        Uploading image...
      </p>
    )}

    {form.image_url && (
      <img
        src={form.image_url}
        alt="Crop"
        className="mt-3 h-40 w-full object-cover rounded-lg border"
      />
    )}
  </div>

</div>
            </div>
          

          <div>
            <h3 className="text-sm font-semibold mb-2 text-foreground">Investment (₹)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {INVESTMENT_KEYS.map((k) => (
                <div key={k}>
                  <Label className="text-xs">{INVESTMENT_LABELS[k]}</Label>
                  <Input type="number" min="0" value={form[k]} onChange={(e) => set(k, Number(e.target.value))} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2 text-foreground">Returns</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Quantity harvested (qtl/kg)</Label>
                <Input type="number" min="0" value={form.quantity_harvested} onChange={(e) => set("quantity_harvested", Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">Market rate (₹ / unit)</Label>
                <Input type="number" min="0" value={form.market_rate} onChange={(e) => set("market_rate", Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">Total selling price (auto)</Label>
                <Input type="text" value={fmt(autoSelling)} readOnly  className="bg-muted font-semibold" />
                <p className="text-xs text-muted-foreground mt-1">= quantity × market rate</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/40 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Total Investment</p>
              <p className="text-lg font-semibold">{fmt(totalInv)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Returns</p>
              <p className="text-lg font-semibold">{fmt(finalSelling)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Net Profit / Loss</p>
              <p className={`text-lg font-semibold ${netProfit >= 0 ? "text-success" : "text-destructive"}`}>{fmt(netProfit)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Profit Margin</p>
              <p className={`text-lg font-semibold ${netProfit >= 0 ? "text-success" : "text-destructive"}`}>{margin.toFixed(1)}%</p>
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
