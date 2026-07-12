import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, Mail, Send, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in — Trip Architect" },
      {
        name: "description",
        content: "Sign in to Trip Architect with email and password.",
      },
    ],
  }),
});

type AuthMode = "signin" | "signup";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate({ to: "/app" });
      }
    });
  }, [navigate]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        navigate({ to: "/app" });
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      if (data.session) {
        navigate({ to: "/app" });
      } else {
        setMessage("Check your inbox to confirm your email, then sign in.");
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-surface text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden lg:block">
          <img
            src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=85"
            alt="Mountain village at sunset"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,12,22,0.72),rgba(7,12,22,0.18))]" />
          <div className="absolute inset-x-0 bottom-0 p-10 text-white">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                <Send className="h-5 w-5 -rotate-45" />
              </span>
              <span className="text-xl font-semibold tracking-tight">Trip Architect</span>
            </Link>
            <h1 className="mt-10 max-w-xl text-5xl font-semibold leading-tight tracking-tight">
              Private travel planning with live deals and weather intelligence.
            </h1>
            <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
              {["Weather matched", "Live stays", "Price monitoring"].map((item) => (
                <div key={item} className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
                  <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                  <p className="mt-3 text-sm font-medium">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft">
                  <Send className="h-4 w-4 -rotate-45 text-brand" />
                </span>
                <span className="text-lg font-semibold tracking-tight">Trip Architect</span>
              </Link>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-brand" />
                Premium access
              </span>
            </div>

            <div className="rounded-[28px] border border-border/70 bg-card p-6 shadow-[0_20px_80px_-48px_rgba(15,23,42,0.55)]">
              <div>
                <p className="text-sm font-medium text-brand">
                  {mode === "signin" ? "Welcome back" : "Start planning smarter"}
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                  {mode === "signin" ? "Sign in to your account" : "Create your account"}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Use email and password auth powered by Supabase. Your saved trips stay tied to
                  your account.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-2 rounded-2xl bg-muted p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                    setMessage(null);
                  }}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    mode === "signin" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                    setMessage(null);
                  }}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    mode === "signup" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  Sign up
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <label className="block">
                  <span className="text-xs font-semibold text-foreground">Email</span>
                  <span className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-3 focus-within:border-brand">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      required
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-foreground">Password</span>
                  <span className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-3 focus-within:border-brand">
                    <LockKeyhole className="h-4 w-4 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      minLength={6}
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((value) => !value)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </span>
                </label>

                {error && (
                  <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger-foreground">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="rounded-2xl border border-success/70 bg-success px-4 py-3 text-sm text-success-foreground">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground shadow-sm hover:opacity-90 disabled:opacity-70"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {mode === "signin" ? "Sign in" : "Create account"}
                  {!loading ? <ArrowRight className="h-4 w-4" /> : null}
                </button>
              </form>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              By continuing, you agree to use Trip Architect for personal travel planning.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
