import { useEffect, useState, type CSSProperties } from "react";
import { History, PartyPopper } from "lucide-react";
import { celebrationMessage } from "./CelebrationMessages";
import "./Celebrations.css";

type Moment = {
  id: string;
  date: string;
  text: string;
  activityId?: string;
  category?: string;
  emoji?: string;
  minutes?: number;
};

type Activity = { id: string; name: string; category: string };
type Notice = { id: string; action: string; caption: string };
type Props = { onDateSelect: (date: Date) => void };
type CategoryMatch = { id: string; label: string; category?: string; goals: readonly number[] };

const CELEBRATION_MS = 2_000;
const SEEN_KEY = "hgo-celebrations-seen";
const MOMENTS_KEY = "hot-girl-moments";
const ACTIVITIES_KEY = "hot-girl-activities";

const STREAKS: readonly CategoryMatch[] = [
  { id: "lore", label: "the daily lore", goals: [3, 5, 7, 14, 30] },
  { id: "jog", label: "jogging", goals: [3, 5, 7, 14] },
  { id: "avery", label: "Avery care", category: "Avery", goals: [3, 7, 14, 30] },
  { id: "care", label: "self-care", category: "Self-care", goals: [3, 7, 14] },
  { id: "home", label: "home care", category: "Home", goals: [3, 5, 7, 14] },
  { id: "fun", label: "fun", category: "Fun", goals: [3, 7, 14] },
];

const TOTALS: readonly CategoryMatch[] = [
  { id: "total", label: "moments", goals: [10, 25, 50, 100, 250, 500] },
  { id: "avery", label: "Avery moments", category: "Avery", goals: [10, 25, 50, 100] },
  { id: "care", label: "self-care moments", category: "Self-care", goals: [10, 25, 50] },
  { id: "home", label: "home moments", category: "Home", goals: [10, 25, 50] },
  { id: "fun", label: "fun moments", category: "Fun", goals: [10, 25, 50] },
];

const CONFETTI = Array.from({ length: 32 }, (_, i) => {
  const angle = (i / 32) * Math.PI * 2;
  const distance = 170 + (i % 5) * 42;
  return {
    "--x": `${Math.cos(angle) * distance}px`,
    "--y": `${Math.sin(angle) * distance}px`,
    "--r": `${i * 67}deg`,
    animationDelay: `${(i % 4) * 50}ms`,
  } as CSSProperties;
});

function dayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readArray<T>(key: string, isValid: (value: unknown) => value is T): T[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value.filter(isValid) : [];
  } catch {
    return [];
  }
}

function isMoment(value: unknown): value is Moment {
  return typeof value === "object" && value !== null &&
    "id" in value && typeof value.id === "string" &&
    "text" in value && typeof value.text === "string" &&
    "date" in value && typeof value.date === "string";
}

function isActivity(value: unknown): value is Activity {
  return typeof value === "object" && value !== null &&
    "id" in value && typeof value.id === "string" &&
    "name" in value && typeof value.name === "string" &&
    "category" in value && typeof value.category === "string";
}

const readMoments = () => readArray(MOMENTS_KEY, isMoment);
const readActivities = () => readArray(ACTIVITIES_KEY, isActivity);

function consecutiveDays(dates: string[], endingOn: string): number {
  const logged = new Set(dates);
  const date = new Date(`${endingOn}T12:00:00`);
  let count = 0;
  while (logged.has(dayKey(date))) {
    count++;
    date.setDate(date.getDate() - 1);
  }
  return count;
}

function firstCrossed(before: number, after: number, goals: readonly number[]) {
  return goals.find(goal => before < goal && after >= goal);
}

function notice(action: string, caption: string): Notice {
  return { id: crypto.randomUUID(), action, caption };
}

/** Keep milestones from replaying on refresh or after another action. */
function milestoneOnce(key: string, action: string, caption: string): Notice | null {
  const seen = readArray(SEEN_KEY, (value): value is string => typeof value === "string");
  // Older milestone IDs must remain recognized after the naming change.
  const legacyKey = key.startsWith("routine:") ? `ritual:${key.slice("routine:".length)}` : key;
  if (seen.includes(key) || seen.includes(legacyKey)) return null;

  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, key]));
  } catch {
    // Still celebrate if browser storage is unavailable.
  }
  return notice(action, caption);
}

function celebrationForMoment(moment: Moment, before: Moment[]): Notice {
  const activities = readActivities();
  const categoriesById = new Map(activities.map(activity => [activity.id, activity.category]));
  const categoriesByName = new Map(activities.map(activity => [activity.name, activity.category]));
  const categoryOf = (entry: Moment) =>
    entry.category ??
    (entry.activityId ? categoriesById.get(entry.activityId) : undefined) ??
    categoriesByName.get(entry.text) ?? "General";

  const category = categoryOf(moment);
  const after = [...before, moment];
  const matches = (entry: Moment, group: CategoryMatch) =>
    group.id === "jog" ? /jog/i.test(entry.text) :
    group.category ? categoryOf(entry) === group.category : true;
  const record = (key: string, caption: string) => milestoneOnce(key, moment.text, caption);

  // New personal best for a timed movement activity or Avery walk.
  const isMovement = (entry: Moment) =>
    categoryOf(entry) === "Movement" ||
    (categoryOf(entry) === "Avery" && /walk/i.test(entry.text));

  if (isMovement(moment) && typeof moment.minutes === "number" && moment.minutes > 0) {
    const priorTimes = before.filter(entry =>
      (moment.activityId && entry.activityId === moment.activityId ||
       entry.text.toLowerCase() === moment.text.toLowerCase()) &&
      entry.date <= moment.date && (entry.minutes ?? 0) > 0
    );
    const previousBest = Math.max(0, ...priorTimes.map(entry => entry.minutes ?? 0));
    if (previousBest > 0 && moment.minutes > previousBest) {
      const special = record(
        `best:${moment.activityId ?? moment.text}:${moment.minutes}`,
        `${moment.minutes} minutes! New personal best (was ${previousBest}).`
      );
      if (special) return special;
    }
  }

  // Celebrate streaks reached, never broken streaks.
  for (const group of STREAKS) {
    if (!matches(moment, group)) continue;
    const length = consecutiveDays(after.filter(entry => matches(entry, group)).map(entry => entry.date), moment.date);
    if (!group.goals.includes(length)) continue;
    const special = record(
      `streak:${group.id}:${length}:${moment.date}`,
      `${length} days of ${group.label}. That's a flex!`
    );
    if (special) return special;
  }

  // Lifetime totals.
  for (const group of TOTALS) {
    const previousCount = before.filter(entry => matches(entry, group)).length;
    const currentCount = after.filter(entry => matches(entry, group)).length;
    const goal = firstCrossed(previousCount, currentCount, group.goals);
    if (!goal) continue;
    const special = record(
      `lifetime:${group.id}:${goal}`,
      `that's ${goal} ${group.label} logged!`
    );
    if (special) return special;
  }

  // New kinds of activities.
  const uniqueCount = (items: Moment[]) =>
    new Set(items.map(entry => entry.activityId ?? entry.text.toLowerCase())).size;
  const uniqueGoal = firstCrossed(uniqueCount(before), uniqueCount(after), [10, 25, 50]);
  if (uniqueGoal) {
    const special = record(
      `unique:${uniqueGoal}`,
      `your ${uniqueGoal}th different activity!`
    );
    if (special) return special;
  }

  // Total minutes spent moving, including Avery walks.
  const movementMinutes = (items: Moment[]) => items.reduce(
    (total, entry) => total + (isMovement(entry) ? entry.minutes ?? 0 : 0), 0
  );
  const minutesGoal = firstCrossed(movementMinutes(before), movementMinutes(after), [300, 600, 1200, 3000]);
  if (minutesGoal) {
    const special = record(
      `movement:${minutesGoal}`,
      `${Math.floor(minutesGoal / 60)} hours of movement logged!`
    );
    if (special) return special;
  }

  // Celebrate an unusually busy or varied day (relative to prior days).
  const otherDays = new Map<string, { count: number; categories: Set<string> }>();
  for (const entry of before) {
    if (entry.date === moment.date) continue;
    const stats = otherDays.get(entry.date) ?? { count: 0, categories: new Set<string>() };
    stats.count++;
    stats.categories.add(categoryOf(entry));
    otherDays.set(entry.date, stats);
  }

  if (otherDays.size >= 1 && new Set(before.map(entry => entry.date)).size >= 2) {
    const todayEntries = after.filter(entry => entry.date === moment.date);
    const bestCount = Math.max(...Array.from(otherDays.values(), stats => stats.count));
    if (todayEntries.length >= 4 && todayEntries.length > bestCount) {
      const special = record(
        `biggest-day:${moment.date}`,
        `${todayEntries.length} moments today. Your fullest day yet!`
      );
      if (special) return special;
    }

    const todayVariety = new Set(todayEntries.map(categoryOf)).size;
    const bestVariety = Math.max(...Array.from(otherDays.values(), stats => stats.categories.size));
    if (todayVariety >= 3 && todayVariety > bestVariety) {
      const special = record(
        `variety-day:${moment.date}`,
        `${todayVariety} different kinds of activities today!`
      );
      if (special) return special;
    }
  }

  return notice(moment.text, celebrationMessage(category));
}

function previousMonthKey(today: Date): string | null {
  const previous = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
  return previous.getDate() === today.getDate() ? dayKey(previous) : null;
}

function previousYearKey(today: Date): string | null {
  const previous = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
  return previous.getDate() === today.getDate() ? dayKey(previous) : null;
}

export default function Celebrations({ onDateSelect }: Props) {
  const [queue, setQueue] = useState<Notice[]>([]);
  const [history, setHistory] = useState<Moment[]>(readMoments);

  useEffect(() => {
    const refresh = () => setHistory(readMoments());
    const enqueue = (message: Notice) => setQueue(previous => [...previous, message]);

    const onMomentSaved = (event: Event) => {
      const detail = (event as CustomEvent<{ moment: Moment; before: Moment[] }>).detail;
      if (!detail || !isMoment(detail.moment) || !Array.isArray(detail.before)) return;
      const { moment, before } = detail;
      // Editing an existing entry or backdating a moment doesn't trigger a celebration.
      if (moment.date !== dayKey(new Date()) || before.some(entry => entry.id === moment.id)) return;
      enqueue(celebrationForMoment(moment, before));
    };

    const onRoutineChecked = (event: Event) => {
      const detail = (event as CustomEvent<{ title: string; date: string; completed: string[] }>).detail;
      if (!detail || typeof detail.title !== "string" || detail.date !== dayKey(new Date()) ||
          !Array.isArray(detail.completed)) return;

      const { title, date, completed } = detail;
      const length = consecutiveDays(completed, date);
      const special = [3, 7, 14, 30].includes(length)
        ? milestoneOnce(`routine:${title}:${date}:${length}`, title, `${length} days in a row. Icon behaviour!`)
        : null;
      enqueue(special ?? notice(title, celebrationMessage("Self-care")));
    };

    const onReminderHandled = (event: Event) => {
      const detail = (event as CustomEvent<{
        title: string; date: string; count: number; previousBest: number;
      }>).detail;
      if (!detail || typeof detail.title !== "string" || detail.date !== dayKey(new Date())) return;

      const { title, date, count, previousBest } = detail;
      const special = count >= 2 && count > previousBest
        ? milestoneOnce(`todo-record:${date}`, title, `${count} reminders handled today. New record!`)
        : null;
      enqueue(special ?? notice(title, celebrationMessage("Life admin")));
    };

    window.addEventListener("hgo-history-updated", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("hgo-moment-saved", onMomentSaved);
    window.addEventListener("hgo-routine-checked", onRoutineChecked);
    window.addEventListener("hgo-reminder-handled", onReminderHandled);

    return () => {
      window.removeEventListener("hgo-history-updated", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("hgo-moment-saved", onMomentSaved);
      window.removeEventListener("hgo-routine-checked", onRoutineChecked);
      window.removeEventListener("hgo-reminder-handled", onReminderHandled);
    };
  }, []);

  const current = queue[0];
  useEffect(() => {
    if (!current) return;
    const timer = window.setTimeout(() => setQueue(previous => previous.slice(1)), CELEBRATION_MS);
    return () => window.clearTimeout(timer);
  }, [current?.id]);

  const today = new Date();
  const lastYear = previousYearKey(today);
  const lastMonth = previousMonthKey(today);
  const throwbackDate = [lastYear, lastMonth].find(date => date && history.some(moment => moment.date === date));
  const throwbacks = history.filter(moment => moment.date === throwbackDate);

  return (
    <>
      {throwbackDate && (
        <button
          type="button"
          className="celebration-throwback"
          onClick={() => {
            onDateSelect(new Date(`${throwbackDate}T12:00:00`));
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <History size={21} aria-hidden="true" />
          <span>
            <small>A LITTLE THROWBACK ♡</small>
            <strong>{throwbackDate === lastYear ? "On this day last year…" : "On this day last month…"}</strong>
            <span>{throwbacks.slice(0, 3).map(moment => `${moment.emoji ?? "✿"} ${moment.text}`).join(" · ")}</span>
          </span>
        </button>
      )}

      {current && (
        <div className="celebration-overlay" key={current.id}>
          <div className="celebration-confetti" aria-hidden="true">
            {CONFETTI.map((style, index) => (
              <span key={index} className="celebration-piece" style={style} />
            ))}
          </div>
          <aside className="celebration-toast" role="status" aria-live="polite">
            <div className="celebration-icon" aria-hidden="true">
              <PartyPopper size={42} strokeWidth={1.6} />
            </div>
            <div className="celebration-copy">
              <strong>{current.action}</strong>
              {current.caption && <span>{current.caption}</span>}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
