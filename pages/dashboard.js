import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { getUserFromReq } from "../lib/auth";
import { CATEGORIES, CATEGORY_STYLES, categoryLabel, categoryEmoji } from "../lib/constants";

export async function getServerSideProps({ req }) {
  const user = getUserFromReq(req);
  if (!user) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  if (user.role !== "student") {
    return { redirect: { destination: "/admin", permanent: false } };
  }
  return { props: { user } };
}

const urgencyStyles = {
  high: "text-rust border-rust",
  medium: "text-gold border-gold",
  low: "text-sage border-sage",
};

// Deterministic per-card tilt so the board feels hand-pinned, not random on every render
const TILTS = ["-rotate-1", "rotate-1", "-rotate-2", "rotate-2", "rotate-0"];
const tiltFor = (id) => TILTS[id % TILTS.length];

export default function Dashboard({ user }) {
  const router = useRouter();
  const [notices, setNotices] = useState([]);
  const [search, setSearch] = useState("");
  const [urgency, setUrgency] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (urgency) params.set("urgency", urgency);
      if (category) params.set("category", category);

      const res = await fetch(`/api/notices?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Couldn't load notices.");
      } else {
        setNotices(data.notices);
      }
    } catch (err) {
      setError("Couldn't load notices. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [search, urgency, category]);

  useEffect(() => {
    const timeout = setTimeout(fetchNotices, 300); // debounce search
    return () => clearTimeout(timeout);
  }, [fetchNotices]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="bg-navy text-paper px-6 py-5 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold">Digital Notice Board</h1>
            <p className="text-paper/60 text-sm mt-0.5 font-mono">
              {user.name} &middot; {user.department} &middot; sem {user.semester}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-paper/80 hover:text-paper border border-paper/25 hover:border-paper/50 rounded-sm px-3 py-1.5 transition-colors"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row gap-3 mb-10">
          <input
            type="text"
            placeholder="Search the board\u2026"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-card border border-ink/10 rounded-sm px-4 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-navy/40"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-card border border-ink/10 rounded-sm px-4 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-navy/40 font-mono text-sm"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.emoji} {cat.label}
              </option>
            ))}
          </select>
          <select
            value={urgency}
            onChange={(e) => setUrgency(e.target.value)}
            className="bg-card border border-ink/10 rounded-sm px-4 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-navy/40 font-mono text-sm"
          >
            <option value="">All urgencies</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {error && <p className="text-rust text-sm mb-4 font-medium">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-20">
            <span className="h-8 w-8 border-4 border-navy border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notices.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-xl text-ink/40">Nothing pinned up yet</p>
            <p className="text-ink/35 text-sm mt-1">Check back later, or try a different search.</p>
          </div>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-10">
            {notices.map((notice, i) => {
              const style = CATEGORY_STYLES[notice.category] || CATEGORY_STYLES.general;
              const isTopPriority = notice.urgency === "high" && (i === 0 || notices[i - 1].urgency !== "high");
              return (
              <li
                key={notice.id}
                className={`relative bg-card rounded-sm shadow-pin hover:shadow-pinHover hover:-translate-y-0.5 transition-all p-5 pt-6 border border-ink/5 border-l-4 ${style.accent} ${tiltFor(notice.id)}`}
              >
                <div className="pin" />

                {isTopPriority && (
                  <span className="absolute -top-2.5 right-4 stamp text-[9px] bg-rust text-paper border-rust px-2 py-0.5 rounded-sm">
                    Top priority
                  </span>
                )}

                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <h2 className="font-display font-semibold text-lg text-ink leading-snug">
                    {notice.title}
                  </h2>
                  <span className={`stamp text-[10px] shrink-0 ${urgencyStyles[notice.urgency]}`}>
                    {notice.urgency}
                  </span>
                </div>

                <span className={`inline-flex items-center gap-1 text-[11px] font-mono font-semibold mb-2 ${style.badge}`}>
                  {categoryEmoji(notice.category)} {categoryLabel(notice.category)}
                </span>

                <p className="text-ink/70 text-sm whitespace-pre-wrap leading-relaxed">
                  {notice.content}
                </p>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-dashed border-ink/10 text-[11px] font-mono text-ink/40">
                  <span>
                    {notice.department}
                    {notice.semester ? ` \u00b7 sem ${notice.semester}` : ""}
                  </span>
                  <span>
                    {notice.author_name} &middot; {new Date(notice.created_at).toLocaleDateString()}
                  </span>
                </div>
              </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
