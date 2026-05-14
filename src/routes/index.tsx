import { createFileRoute, Link } from "@tanstack/react-router";
import { Sprout, BarChart3, FileText, Wheat, ArrowRight, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/40">
      <header className="container mx-auto flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sprout className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg">Kisan Track</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" asChild><Link to="/auth">Sign in</Link></Button>
          <Button asChild><Link to="/auth">Get started</Link></Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16 sm:py-24">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            <Sprout className="h-3 w-3" /> Built for Indian farmers
          </span>
          <h1 className="mt-6 text-5xl sm:text-6xl font-extrabold tracking-tight text-foreground">
            Track every crop. <span className="text-primary">Grow your profit.</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-xl">
            Kisan Track helps you record investment, harvest and returns across all four quarters — and turns it into beautiful reports you can share.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to="/auth">
                Start tracking <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/auth">I already have an account</Link>
            </Button>
          </div>
        </div>

        <div className="mt-20 grid sm:grid-cols-3 gap-6">
          {[
            { icon: Wheat, title: "Crop CRUD", body: "Add seasonal crops, track sowing & harvest with rich investment categories." },
            { icon: BarChart3, title: "Live analytics", body: "Visual charts of investments, returns, expense breakdowns & profit trends." },
            { icon: FileText, title: "PDF reports", body: "Generate quarter, crop and annual reports in one click. Print or share." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-6 shadow-sm transition hover:shadow-md hover:border-primary/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-card-foreground">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
