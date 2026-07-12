import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  RotateCw,
  Send,
  ShieldCheck,
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in - Trip Architect" },
      {
        name: "description",
        content: "Sign in to Trip Architect with email and password.",
      },
    ],
  }),
});

type AuthMode = "signin" | "signup";

function authRedirectUrl() {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}/auth`;
}

function readSupabaseUrlError() {
  if (typeof window === "undefined") return null;

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(window.location.search);
  const code = hashParams.get("error_code") || searchParams.get("error_code");
  const description = hashParams.get("error_description") || searchParams.get("error_description");

  if (!code && !description) return null;
  if (code === "otp_expired") {
    return "That confirmation link is expired or already used. Request a fresh confirmation email below.";
  }
  return description?.replace(/\+/g, " ") || "We could not complete the auth redirect.";
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const redirectError = readSupabaseUrlError();
    if (redirectError) {
      setError(redirectError);
      window.history.replaceState(null, "", "/auth");
      return;
    }

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

    if (!isSupabaseConfigured) {
      setError("Authentication is not configured yet. Add the frontend auth keys to frontend/.env, then restart the dev server.");
      return;
    }

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
        options: {
          emailRedirectTo: authRedirectUrl(),
        },
      });

      if (signUpError) throw signUpError;

      if (data.session) {
        navigate({ to: "/app" });
      } else {
        setMessage("Confirmation email sent. Open the latest email, then come back here to sign in.");
        setMode("signin");
      }
    } catch (authError) {
      const nextError = authError instanceof Error ? authError.message : "Authentication failed.";
      setError(
        /email not confirmed/i.test(nextError)
          ? "Email is not confirmed yet. Use the latest confirmation email or resend it below."
          : nextError,
      );
    } finally {
      setLoading(false);
    }
  }

  async function resendConfirmation() {
    if (!email) {
      setError("Enter your email first, then resend confirmation.");
      return;
    }

    setError(null);
    setMessage(null);
    setResending(true);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: authRedirectUrl(),
        },
      });

      if (resendError) throw resendError;
      setMessage("Fresh confirmation email sent. Use the newest link only.");
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : "Could not resend confirmation.");
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f4f2] px-5 py-8 text-foreground">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/80 bg-white/85 shadow-[0_28px_90px_-52px_rgba(3,3,3,0.5)] backdrop-blur-xl lg:grid-cols-[0.92fr_1.08fr]">
        <div className="hidden border-r border-border/70 bg-[#0f0f0f] p-8 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black">
                <Send className="h-5 w-5 -rotate-45" />
              </span>
              <span className="text-lg font-semibold tracking-tight">Trip Architect</span>
            </Link>
            <h1 className="mt-12 max-w-sm text-4xl font-semibold leading-tight tracking-tight">
              Your private desk for smarter travel decisions.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/60">
              Secure access to weather-matched plans, live stays, flights, and price monitoring.
            </p>
          </div>

          <div className="grid gap-3">
            {[
              "Email and password access",
              "Saved trip requests",
              "Live planning updates",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <span className="text-sm text-white/78">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 sm:p-8 lg:p-10">
          <div className="mb-8 flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2 lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft">
                <Send className="h-4 w-4 -rotate-45 text-brand" />
              </span>
              <span className="text-lg font-semibold tracking-tight">Trip Architect</span>
            </Link>
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-brand" />
              Secure access
            </span>
          </div>

          <div className="max-w-md">
            <p className="text-sm font-semibold text-brand">
              {mode === "signin" ? "Welcome back" : "Create your workspace"}
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {mode === "signin" ? "Sign in to continue" : "Start with email"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Use the same email you confirmed. Expired confirmation link? Resend a new one.
            </p>
          </div>

          <div className="mt-7 grid max-w-md grid-cols-2 rounded-2xl border border-border bg-muted p-1">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
                setMessage(null);
              }}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                mode === "signin" ? "opacity-100" : "opacity-70"
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
                mode === "signup" ? "opacity-100" : "opacity-70"
              }`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4">
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

          <button
            type="button"
            onClick={resendConfirmation}
            disabled={resending}
            className="mt-4 inline-flex max-w-md items-center justify-center gap-2 rounded-2xl px-4 py-2 text-xs font-semibold"
          >
            {resending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCw className="h-3.5 w-3.5" />}
            Resend confirmation email
          </button>

          <p className="mt-7 max-w-md text-xs leading-5 text-muted-foreground">
            If confirmation redirects to the landing page, add this redirect URL in your auth provider:
            <span className="mt-1 block rounded-lg bg-muted px-2 py-1 font-mono text-[11px] text-foreground">
              http://127.0.0.1:5173/auth
            </span>
          </p>
        </div>
      </section>
    </main>
  );
}
