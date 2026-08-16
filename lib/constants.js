// Shared option lists so the notice form (target audience) and the
// add-student form (a student's own dept/semester) always stay in sync.

export const DEPARTMENTS = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT"];

// "ALL" is only a valid *notice* target (broadcast to every department),
// not a real student department.
export const NOTICE_DEPARTMENTS = ["ALL", ...DEPARTMENTS];

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

// Notice category (what kind of notice this is), separate from urgency
// (how important it is). Urgency decides sort order; category decides
// how the notice looks/reads on the board.
export const CATEGORIES = [
  { value: "general", label: "General", emoji: "\u{1F4CC}" }, // 📌
  { value: "academic", label: "Academic", emoji: "\u{1F4DA}" }, // 📚
  { value: "festive", label: "Festive", emoji: "\u{1F389}" }, // 🎉
  { value: "event", label: "Event", emoji: "\u{1F4C5}" }, // 📅
  { value: "exam", label: "Exam", emoji: "\u{1F4DD}" }, // 📝
  { value: "holiday", label: "Holiday", emoji: "\u{1F3D6}\u{FE0F}" }, // 🏖️
];

// Tailwind classes for each category's badge (text + border colors from
// tailwind.config.js) and a soft card-accent border used on the notice card.
export const CATEGORY_STYLES = {
  general: { badge: "text-ink/60 border-ink/30", accent: "border-l-ink/30" },
  academic: { badge: "text-steel border-steel", accent: "border-l-steel" },
  festive: { badge: "text-berry border-berry", accent: "border-l-berry" },
  event: { badge: "text-teal border-teal", accent: "border-l-teal" },
  exam: { badge: "text-amber border-amber", accent: "border-l-amber" },
  holiday: { badge: "text-moss border-moss", accent: "border-l-moss" },
};

export function categoryLabel(value) {
  const found = CATEGORIES.find((c) => c.value === value);
  return found ? found.label : "General";
}

export function categoryEmoji(value) {
  const found = CATEGORIES.find((c) => c.value === value);
  return found ? found.emoji : CATEGORIES[0].emoji;
}
