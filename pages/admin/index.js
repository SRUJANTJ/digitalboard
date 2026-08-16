import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { getUserFromReq } from "../../lib/auth";
import { NOTICE_DEPARTMENTS, DEPARTMENTS, SEMESTERS, CATEGORIES, CATEGORY_STYLES, categoryLabel, categoryEmoji } from "../../lib/constants";

export async function getServerSideProps({ req }) {
  const user = getUserFromReq(req);
  if (!user) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  if (user.role !== "admin") {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }
  return { props: { user } };
}

const emptyNoticeForm = { title: "", content: "", department: "ALL", semester: "", urgency: "medium", category: "general" };
const emptyStudentForm = { username: "", password: "", name: "", department: DEPARTMENTS[0], semester: "" };

const urgencyStyles = {
  high: "text-rust border-rust",
  medium: "text-gold border-gold",
  low: "text-sage border-sage",
};

const TILTS = ["-rotate-1", "rotate-1", "-rotate-2", "rotate-2", "rotate-0"];
const tiltFor = (id) => TILTS[id % TILTS.length];

const inputClass =
  "w-full bg-paper border border-ink/15 rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy/40";

export default function AdminPanel({ user }) {
  const router = useRouter();
  const [tab, setTab] = useState("notices"); // "notices" | "students"

  // ----- Notices -----
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyNoticeForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/notices");
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
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  function startEdit(notice) {
    setEditingId(notice.id);
    setForm({
      title: notice.title,
      content: notice.content,
      department: notice.department,
      semester: notice.semester || "",
      urgency: notice.urgency,
      category: notice.category || "general",
    });
    setTab("notices");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyNoticeForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = editingId ? `/api/notices/${editingId}` : "/api/notices";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          semester: form.semester ? Number(form.semester) : null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Couldn't save that notice.");
      } else {
        cancelEdit();
        fetchNotices();
      }
    } catch (err) {
      setError("Couldn't save that notice. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Unpin this notice for good? This can't be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/notices/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotices((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      setError("Couldn't delete that notice.");
    } finally {
      setDeletingId(null);
    }
  }

  // ----- Students -----
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentError, setStudentError] = useState("");
  const [studentForm, setStudentForm] = useState(emptyStudentForm);
  const [addingStudent, setAddingStudent] = useState(false);
  const [removingStudentId, setRemovingStudentId] = useState(null);

  const fetchStudents = useCallback(async () => {
    setStudentsLoading(true);
    setStudentError("");
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (!res.ok) {
        setStudentError(data.error || "Couldn't load students.");
      } else {
        setStudents(data.students);
      }
    } catch (err) {
      setStudentError("Couldn't load students. Please try again.");
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  async function handleAddStudent(e) {
    e.preventDefault();
    setAddingStudent(true);
    setStudentError("");

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentForm),
      });
      const data = await res.json();

      if (!res.ok) {
        setStudentError(data.error || "Couldn't add that student.");
      } else {
        setStudentForm({ ...emptyStudentForm, department: DEPARTMENTS[0] });
        fetchStudents();
      }
    } catch (err) {
      setStudentError("Couldn't add that student. Please try again.");
    } finally {
      setAddingStudent(false);
    }
  }

  async function handleRemoveStudent(id) {
    if (!confirm("Remove this student's account? This can't be undone.")) return;
    setRemovingStudentId(id);
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        setStudents((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      setStudentError("Couldn't remove that student.");
    } finally {
      setRemovingStudentId(null);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="bg-navy text-paper px-6 py-5 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold">Digital Notice Board &middot; Admin</h1>
            <p className="text-paper/60 text-sm mt-0.5 font-mono">
              {user.name} &middot; {user.role}
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
        <div className="flex gap-2 mb-8 border-b border-ink/10">
          <button
            onClick={() => setTab("notices")}
            className={`px-4 py-2.5 text-sm font-semibold tracking-wide border-b-2 -mb-px transition-colors ${
              tab === "notices" ? "border-navy text-navy" : "border-transparent text-ink/40 hover:text-ink/70"
            }`}
          >
            Notices
          </button>
          <button
            onClick={() => setTab("students")}
            className={`px-4 py-2.5 text-sm font-semibold tracking-wide border-b-2 -mb-px transition-colors ${
              tab === "students" ? "border-navy text-navy" : "border-transparent text-ink/40 hover:text-ink/70"
            }`}
          >
            Students
          </button>
        </div>

        {tab === "notices" && (
          <>
            <form
              onSubmit={handleSubmit}
              className="relative bg-card rounded-sm shadow-pin p-6 pt-8 mb-12 border border-ink/5"
            >
              <div className="pin" />
              <h2 className="font-display font-semibold text-xl text-navy mb-5">
                {editingId ? "Editing a pinned notice" : "Post a new notice"}
              </h2>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inputClass}
                  required
                />
                <textarea
                  placeholder="What does everyone need to know?"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={4}
                  className={inputClass}
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-ink/50 mb-1">
                      Category
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className={inputClass}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.emoji} {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-ink/50 mb-1">
                      Urgency
                    </label>
                    <select
                      value={form.urgency}
                      onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                      className={inputClass}
                    >
                      <option value="low">Low urgency</option>
                      <option value="medium">Medium urgency</option>
                      <option value="high">High urgency &mdash; shows at top</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-ink/50 mb-1">
                      Department
                    </label>
                    <select
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      className={inputClass}
                    >
                      {NOTICE_DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept === "ALL" ? "All departments" : dept}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-ink/50 mb-1">
                      Semester
                    </label>
                    <select
                      value={form.semester}
                      onChange={(e) => setForm({ ...form, semester: e.target.value })}
                      className={inputClass}
                    >
                      <option value="">All semesters</option>
                      {SEMESTERS.map((sem) => (
                        <option key={sem} value={sem}>
                          Semester {sem}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {error && <p className="text-rust text-sm font-medium mt-3">{error}</p>}

              <div className="flex gap-2 mt-5">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-navy text-paper rounded-sm px-5 py-2.5 font-semibold tracking-wide hover:bg-navy-light disabled:opacity-60 transition-colors flex items-center gap-2"
                >
                  {saving && (
                    <span className="h-4 w-4 border-2 border-paper border-t-transparent rounded-full animate-spin" />
                  )}
                  {editingId ? "Save changes" : "Pin to board"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="border border-ink/20 rounded-sm px-5 py-2.5 font-medium text-ink/60 hover:bg-ink/5 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="flex items-baseline justify-between mb-5">
              <h2 className="font-display font-semibold text-xl text-navy">All notices</h2>
              <p className="text-ink/40 text-xs font-mono">Highest priority pinned first</p>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <span className="h-8 w-8 border-4 border-navy border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notices.length === 0 ? (
              <p className="text-ink/40 text-center py-20 font-display text-xl">
                The board is empty &mdash; post the first notice above.
              </p>
            ) : (
              <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-10">
                {notices.map((notice, i) => {
                  const style = CATEGORY_STYLES[notice.category] || CATEGORY_STYLES.general;
                  const isTopPriority = notice.urgency === "high" && (i === 0 || notices[i - 1].urgency !== "high");
                  return (
                  <li
                    key={notice.id}
                    className={`relative bg-card rounded-sm shadow-pin hover:shadow-pinHover transition-shadow p-5 pt-6 border border-ink/5 border-l-4 ${style.accent} ${tiltFor(notice.id)}`}
                  >
                    <div className="pin" />

                    {isTopPriority && (
                      <span className="absolute -top-2.5 right-4 stamp text-[9px] bg-rust text-paper border-rust px-2 py-0.5 rounded-sm">
                        Top priority
                      </span>
                    )}

                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <h3 className="font-display font-semibold text-lg text-ink leading-snug">
                        {notice.title}
                      </h3>
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

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-dashed border-ink/10 text-[11px] font-mono">
                      <span className="text-ink/40">
                        {notice.department}
                        {notice.semester ? ` \u00b7 sem ${notice.semester}` : ""}
                      </span>
                      <div className="flex gap-3">
                        <button
                          onClick={() => startEdit(notice)}
                          className="text-navy hover:text-navy-light font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(notice.id)}
                          disabled={deletingId === notice.id}
                          className="text-rust hover:opacity-70 font-semibold disabled:opacity-50"
                        >
                          {deletingId === notice.id ? "Removing\u2026" : "Remove"}
                        </button>
                      </div>
                    </div>
                  </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

        {tab === "students" && (
          <>
            <form
              onSubmit={handleAddStudent}
              className="relative bg-card rounded-sm shadow-pin p-6 pt-8 mb-12 border border-ink/5"
            >
              <div className="pin" />
              <h2 className="font-display font-semibold text-xl text-navy mb-5">Add a student</h2>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Full name"
                    value={studentForm.name}
                    onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                    className={inputClass}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Username"
                    value={studentForm.username}
                    onChange={(e) => setStudentForm({ ...studentForm, username: e.target.value })}
                    className={inputClass}
                    required
                  />
                </div>
                <input
                  type="password"
                  placeholder="Password"
                  value={studentForm.password}
                  onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                  className={inputClass}
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-ink/50 mb-1">
                      Department
                    </label>
                    <select
                      value={studentForm.department}
                      onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                      className={inputClass}
                      required
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-ink/50 mb-1">
                      Semester
                    </label>
                    <select
                      value={studentForm.semester}
                      onChange={(e) => setStudentForm({ ...studentForm, semester: e.target.value })}
                      className={inputClass}
                      required
                    >
                      <option value="" disabled>
                        Select semester
                      </option>
                      {SEMESTERS.map((sem) => (
                        <option key={sem} value={sem}>
                          Semester {sem}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {studentError && <p className="text-rust text-sm font-medium mt-3">{studentError}</p>}

              <div className="flex gap-2 mt-5">
                <button
                  type="submit"
                  disabled={addingStudent}
                  className="bg-navy text-paper rounded-sm px-5 py-2.5 font-semibold tracking-wide hover:bg-navy-light disabled:opacity-60 transition-colors flex items-center gap-2"
                >
                  {addingStudent && (
                    <span className="h-4 w-4 border-2 border-paper border-t-transparent rounded-full animate-spin" />
                  )}
                  Add student
                </button>
              </div>
            </form>

            <h2 className="font-display font-semibold text-xl text-navy mb-5">All students</h2>

            {studentsLoading ? (
              <div className="flex justify-center py-20">
                <span className="h-8 w-8 border-4 border-navy border-t-transparent rounded-full animate-spin" />
              </div>
            ) : students.length === 0 ? (
              <p className="text-ink/40 text-center py-20 font-display text-xl">
                No students yet &mdash; add the first one above.
              </p>
            ) : (
              <div className="bg-card rounded-sm shadow-pin border border-ink/5 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-ink/10 text-ink/50 text-xs uppercase tracking-wide font-mono">
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Username</th>
                      <th className="px-4 py-3">Dept</th>
                      <th className="px-4 py-3">Sem</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s.id} className="border-b border-ink/5 last:border-0">
                        <td className="px-4 py-3 font-medium text-ink">{s.name}</td>
                        <td className="px-4 py-3 font-mono text-ink/60">{s.username}</td>
                        <td className="px-4 py-3">{s.department}</td>
                        <td className="px-4 py-3">{s.semester}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleRemoveStudent(s.id)}
                            disabled={removingStudentId === s.id}
                            className="text-rust hover:opacity-70 font-semibold disabled:opacity-50"
                          >
                            {removingStudentId === s.id ? "Removing\u2026" : "Remove"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
