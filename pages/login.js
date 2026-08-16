import { useState } from "react";
import { useRouter } from "next/router";
import { getUserFromReq } from "../lib/auth";

export async function getServerSideProps({ req }) {
  const user = getUserFromReq(req);
  if (user) {
    return {
      redirect: {
        destination: user.role === "student" ? "/dashboard" : "/admin",
        permanent: false,
      },
    };
  }
  return { props: {} };
}

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "That username or password isn't right.");
        setLoading(false);
        return;
      }

      router.push(data.user.role === "student" ? "/dashboard" : "/admin");
    } catch (err) {
      setError("Couldn't reach the server. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="stamp text-navy border-navy text-xs">digital notice board</span>
        </div>

        <div className="relative bg-card rounded-sm shadow-pin px-8 pt-10 pb-8 border border-ink/5">
          <div className="pin" />

          <h1 className="font-display text-3xl font-semibold text-navy text-center leading-tight">
            Digital Notice Board
          </h1>
          <p className="text-ink/50 text-sm text-center mt-1 mb-8">
            Sign in to read what's pinned up
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink/60 mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border-b-2 border-ink/15 bg-transparent px-1 py-2 text-ink focus:outline-none focus:border-navy transition-colors"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink/60 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-b-2 border-ink/15 bg-transparent px-1 py-2 text-ink focus:outline-none focus:border-navy transition-colors"
                required
              />
            </div>

            {error && (
              <p className="text-rust text-sm font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy text-paper rounded-sm py-2.5 font-semibold tracking-wide hover:bg-navy-light active:bg-navy-dark disabled:opacity-60 transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading && (
                <span className="h-4 w-4 border-2 border-paper border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? "Signing in\u2026" : "Sign in"}
            </button>
          </form>

          <div className="mt-7 pt-5 border-t border-dashed border-ink/15 text-xs text-ink/45 font-mono">
            <p className="font-semibold text-ink/60 mb-1.5 uppercase tracking-wide text-[11px]">
              Test accounts
            </p>
            <p>admin / admin123</p>
            <p>student1 / student123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
