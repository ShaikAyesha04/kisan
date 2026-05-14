import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const { data: profile, refetch } = useQuery({
    queryKey: ["profile-edit", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      return data;
    },
  });

  const [form, setForm] = useState({ name: "", mobile: "", village: "", district: "", land_size: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name ?? "",
        mobile: profile.mobile ?? "",
        village: profile.village ?? "",
        district: profile.district ?? "",
        land_size: profile.land_size != null ? String(profile.land_size) : "",
      });
    }
  }, [profile]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      name: form.name,
      mobile: form.mobile,
      village: form.village,
      district: form.district,
      land_size: form.land_size === "" ? null : Number(form.land_size),
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    refetch();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground">Your farmer details</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Personal info</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Full name</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
              <div><Label>Email</Label><Input value={user?.email ?? ""} disabled /></div>
              <div><Label>Mobile</Label><Input value={form.mobile} onChange={(e) => set("mobile", e.target.value)} /></div>
              <div><Label>Land size (acres)</Label><Input type="number" min="0" step="0.1" value={form.land_size} onChange={(e) => set("land_size", e.target.value)} /></div>
              <div><Label>Village</Label><Input value={form.village} onChange={(e) => set("village", e.target.value)} /></div>
              <div><Label>District</Label><Input value={form.district} onChange={(e) => set("district", e.target.value)} /></div>
            </div>
            <Button type="submit" disabled={busy}>{busy ? "Saving..." : "Save changes"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
