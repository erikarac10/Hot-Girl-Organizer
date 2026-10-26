import { useEffect, useState } from "react";
import { PartyPopper, X, History } from "lucide-react";
import { randomCompliment } from "./CelebrationMessages";
import "./Celebrations.css";

type Moment = {
  id: string;
  date: string;
  text: string;
  category?: string;
  activityId?: string;
  emoji?: string;
  minutes?: number;
};

type Activity = { id: string; name: string; category: string };
type Notice = { id: string; title: string; detail: string; compliment?: string };
type Props = { onDateSelect: (date: Date) => void };

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function readMoments(): Moment[] {
  try { return JSON.parse(localStorage.getItem("hot-girl-moments") || "[]"); }
  catch { return []; }
}

function readActivities(): Activity[] {
  try { return JSON.parse(localStorage.getItem("hot-girl-activities") || "[]"); }
  catch { return []; }
}

function categoryOf(moment: Moment, activities: Activity[]) {
  return moment.category ?? activities.find(a => a.id === moment.activityId || a.name === moment.text)?.category ?? "Other";
}

function consecutiveDays(dates: string[], endingOn: string) {
  const logged = new Set(dates);
  const date = new Date(`${endingOn}T12:00:00`);
  let count = 0;
  while (logged.has(dayKey(date))) {
    count++;
    date.setDate(date.getDate() - 1);
  }
  return count;
}

function firstCrossed(before: number, after: number, milestones: number[]) {
  return milestones.find(value => before < value && after >= value);
}

// Save award IDs so a milestone won't replay after refresh or re-logging.
function newAward(key: string, title: string, detail: string): Notice | null {
  const storageKey = "hgo-celebrations-seen";
  let seen: string[] = [];
  try { seen = JSON.parse(localStorage.getItem(storageKey) || "[]"); }
  catch { /* start fresh */ }
  if (seen.includes(key)) return null;
  try { localStorage.setItem(storageKey, JSON.stringify([...seen, key])); }
  catch { /* allow in private browsing */ }
  return { id: crypto.randomUUID(), title, detail };
}

function awardsForMoment(moment: Moment, before: Moment[]): Notice[] {
  // Editing or backdating old entries still updates history, but never triggers fake new wins.
  if (moment.date !== dayKey(new Date())) return [];

  const activities = readActivities();
  const after = [...before.filter(entry => entry.id !== moment.id), moment];
  const category = categoryOf(moment, activities);
  const awards: Notice[] = [];
  const add = (key: string, title: string, detail: string) => {
    const notice = newAward(key, title, detail);
    if (notice) awards.push(notice);
  };

  // 1. Personal bests for timed movement (including Avery walks).
  const active = category === "Movement" || (category === "Avery" && /walk/i.test(moment.text));
  if (active && moment.minutes && moment.minutes > 0) {
    const oldTimes = before.filter(entry =>
      (entry.activityId && entry.activityId === moment.activityId ||
       entry.text.toLowerCase() === moment.text.toLowerCase()) &&
      entry.date <= moment.date && (entry.minutes ?? 0) > 0
    );
    const previousBest = Math.max(0, ...oldTimes.map(entry => entry.minutes ?? 0));
    if (previousBest > 0 && moment.minutes > previousBest) {
      const first = [...oldTimes].sort((a, b) => a.date.localeCompare(b.date))[0];
      const comparison = first?.minutes && first.minutes < moment.minutes
        ? ` First recorded: ${first.minutes} min. Now: ${moment.minutes} min.`
        : "";
      add(`best:${moment.activityId ?? moment.text}:${moment.minutes}`,
        "NEW PERSONAL BEST ✦",
        `${moment.text}: ${moment.minutes} min. Previous best: ${previousBest} min.${comparison}`);
    }
  }

  // 2. Secret streaks: check milestones, never warn about a broken streak.
  const streaks = [
    { id: "lore", label: "The Lore Continues", matches: (_: Moment) => true, goals: [3, 5, 7, 14, 30] },
    { id: "jog", label: "Cardio Girly Era", matches: (m: Moment) => /jog/i.test(m.text), goals: [3, 5, 7, 14] },
    { id: "avery", label: "Certified Dog Mom", matches: (m: Moment) => categoryOf(m, activities) === "Avery", goals: [3, 7, 14, 30] },
    { id: "care", label: "Princess Maintenance Department", matches: (m: Moment) => categoryOf(m, activities) === "Self-care", goals: [3, 7, 14] },
    { id: "home", label: "Domestic Goddess Era", matches: (m: Moment) => categoryOf(m, activities) === "Home", goals: [3, 5, 7, 14] },
    { id: "fun", label: "Main Character Behaviour", matches: (m: Moment) => categoryOf(m, activities) === "Fun", goals: [3, 7, 14] }
  ];
  for (const streak of streaks) {
    if (!streak.matches(moment)) continue;
    const length = consecutiveDays(after.filter(streak.matches).map(m => m.date), moment.date);
    if (streak.goals.includes(length)) {
      add(`streak:${streak.id}:${length}:${moment.date}`,
        `${streak.label} ♡`,
        `${length} days in a row happened naturally. We love a surprise plot twist.`);
    }
  }

  // 3. Lifetime milestones and positive discoveries.
  const milestones = [
    { id: "total", label: "The Lore Runs Deep", matches: (_: Moment) => true, goals: [10, 25, 50, 100, 250, 500] },
    { id: "avery", label: "Avery Appreciation Society", matches: (m: Moment) => categoryOf(m, activities) === "Avery", goals: [10, 25, 50, 100] },
    { id: "care", label: "Self-Care Socialite", matches: (m: Moment) => categoryOf(m, activities) === "Self-care", goals: [10, 25, 50] },
    { id: "home", label: "Domestic Diva", matches: (m: Moment) => categoryOf(m, activities) === "Home", goals: [10, 25, 50] },
    { id: "fun", label: "The Girl Has Hobbies", matches: (m: Moment) => categoryOf(m, activities) === "Fun", goals: [10, 25, 50] }
  ];
  for (const group of milestones) {
    const reached = firstCrossed(before.filter(group.matches).length, after.filter(group.matches).length, group.goals);
    if (reached) add(`lifetime:${group.id}:${reached}`, group.label,
      `${reached} ${group.id === "total" ? "total moments" : group.id === "care" ? "self-care moments" : group.id === "home" ? "home moments" : group.id === "fun" ? "fun moments" : "Avery moments"} recorded. That's actual lore.`);
  }

  const countUnique = (entries: Moment[]) => new Set(entries.map(m => m.activityId ?? m.text.toLowerCase())).size;
  const uniqueMilestone = firstCrossed(countUnique(before), countUnique(after), [10, 25, 50]);
  if (uniqueMilestone) add(`unique:${uniqueMilestone}`, "Side Quest Collector ✦",
    `${uniqueMilestone} different activities in your life archives. The range? Absurd.`);

  const timedMovement = (entries: Moment[]) => entries.reduce((total, entry) => {
    const type = categoryOf(entry, activities);
    return total + ((type === "Movement" || (type === "Avery" && /walk/i.test(entry.text))) ? (entry.minutes ?? 0) : 0);
  }, 0);
  const minutesMilestone = firstCrossed(timedMovement(before), timedMovement(after), [300, 600, 1200, 3000]);
  if (minutesMilestone) add(`movement:${minutesMilestone}`, "Touch Grass Cinematic Universe",
    `${Math.floor(minutesMilestone / 60)} hours of recorded movement across your archives. That adds up!`);

  // New most-varied day or most receipts on a day (only after some history exists).
  const previousDays = new Set(before.map(entry => entry.date));
  if (previousDays.size >= 2) {
    const previousCounts = [...previousDays].filter(date => date !== moment.date)
      .map(date => before.filter(entry => entry.date === date).length);
    const bestOtherDay = Math.max(0, ...previousCounts);
    const todayCount = after.filter(entry => entry.date === moment.date).length;
    if (todayCount >= 4 && todayCount > bestOtherDay) {
      add(`biggest-day:${moment.date}`, "The Plot Thickens ✦",
        `${todayCount} moments today. New personal record for daily lore!`);
    }
    const categoryVariety = (entries: Moment[], date: string) =>
      new Set(entries.filter(m => m.date === date).map(m => categoryOf(m, activities))).size;
    const previousVariety = Math.max(0, ...[...previousDays].filter(date => date !== moment.date)
      .map(date => categoryVariety(before, date)));
    const todaysVariety = categoryVariety(after, moment.date);
    if (todaysVariety >= 3 && todaysVariety > previousVariety) {
      add(`variety-day:${moment.date}`, "Variety Princess 🎀",
        `${todaysVariety} different categories in one day. Girl has RANGE.`);
    }
  }
  return awards;
}

function previousMonthKey(today: Date) {
  const day = today.getDate();
  const monthBefore = new Date(today.getFullYear(), today.getMonth() - 1, day);
  return monthBefore.getDate() === day ? dayKey(monthBefore) : null;
}

export default function Celebrations({ onDateSelect }: Props) {
  const [queue, setQueue] = useState<Notice[]>([]);
  const [history, setHistory] = useState<Moment[]>(readMoments);

  useEffect(() => {
    const refresh = () => setHistory(readMoments());
    const momentSaved = (event: Event) => {
      const { moment, before } = (event as CustomEvent<{ moment: Moment; before: Moment[] }>).detail;
      if (moment.date !== dayKey(new Date())) return;
      const awards = awardsForMoment(moment, before);
      const compliment = randomCompliment(categoryOf(moment, readActivities()));
      const notices = awards.length
        ? awards.map((award, i) => ({ ...award, compliment: i === 0 ? compliment : undefined }))
        : [{ id: crypto.randomUUID(), title: "THE RECEIPTS ARE RECEIPTING", detail: moment.text, compliment }];
      setQueue(current => [...current, ...notices]);
    };
    const ritualChecked = (event: Event) => {
      const { title, date, completed } = (event as CustomEvent<{ title: string; date: string; completed: string[] }>).detail;
      if (date !== dayKey(new Date())) return;
      const length = consecutiveDays(completed, date);
      const award = [3, 7, 14, 30].includes(length)
        ? newAward(`ritual:${title}:${date}:${length}`, "Ritual Era Unlocked ♡",
            `${title}: ${length} days in a row. You weren't even trying to impress us.`)
        : null;
      setQueue(current => [...current, award
        ? { ...award, compliment: randomCompliment("Self-care") }
        : { id: crypto.randomUUID(), title: "A LITTLE RITUAL, A LITTLE LORE", detail: title, compliment: randomCompliment("Self-care") }
      ]);
    };
    const reminderHandled = (event: Event) => {
      const { title, date, count, previousBest } = (event as CustomEvent<{
        title: string; date: string; count: number; previousBest: number;
      }>).detail;
      if (date !== dayKey(new Date())) return;
      const award = count >= 2 && count > previousBest
        ? newAward(`todo-record:${date}`, "Brain Tabs Closed ✦",
          `${count} to-dos handled today. New personal best.`)
        : null;
      setQueue(current => [...current, award
        ? { ...award, compliment: randomCompliment("Life admin") }
        : { id: crypto.randomUUID(), title: "ONE LESS BRAIN TAB", detail: title, compliment: randomCompliment("Life admin") }
      ]);
    };
    window.addEventListener("hgo-history-updated", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("hgo-moment-saved", momentSaved);
    window.addEventListener("hgo-ritual-checked", ritualChecked);
    window.addEventListener("hgo-reminder-handled", reminderHandled);
    return () => {
      window.removeEventListener("hgo-history-updated", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("hgo-moment-saved", momentSaved);
      window.removeEventListener("hgo-ritual-checked", ritualChecked);
      window.removeEventListener("hgo-reminder-handled", reminderHandled);
    };
  }, []);

  const current = queue[0];
  useEffect(() => {
    if (!current) return;
    const timer = window.setTimeout(() => setQueue(q => q.slice(1)), 10000);
    return () => window.clearTimeout(timer);
  }, [current?.id]);

  const today = new Date();
  const lastMonth = previousMonthKey(today);
  const lastYearDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
  const lastYear = lastYearDate.getDate() === today.getDate() ? dayKey(lastYearDate) : null;
  const throwbackDate = [lastYear, lastMonth].find(date => date && history.some(m => m.date === date));
  const throwbacks = history.filter(m => m.date === throwbackDate);

  return (
    <>
      {throwbackDate && (
        <button className="celebration-throwback" onClick={() => {
          onDateSelect(new Date(`${throwbackDate}T12:00:00`));
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}>
          <History size={21} />
          <span>
            <small>A LITTLE THROWBACK ♡</small>
            <strong>{throwbackDate === lastYear ? "On this day last year…" : "On this day last month…"}</strong>
            <span>{throwbacks.slice(0, 3).map(m => `${m.emoji ?? "✿"} ${m.text}`).join(" · ")}</span>
          </span>
        </button>
      )}

      {current && (
        <aside className="celebration-toast" role="status" aria-live="polite">
          <div className="celebration-icon"><PartyPopper size={22} /></div>
          <div className="celebration-copy">
            <small>HOT GIRL ORGANIZER SAYS</small>
            <strong>{current.title}</strong>
            <p>{current.detail}</p>
            {current.compliment && <em>{current.compliment}</em>}
          </div>
          <button aria-label="Dismiss celebration" onClick={() => setQueue(q => q.slice(1))}>
            <X size={18} />
          </button>
        </aside>
      )}
    </>
  );
}
