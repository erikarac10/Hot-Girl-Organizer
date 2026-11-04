import { useEffect, useMemo, useState } from "react";
import { Clock3, Heart, House, PawPrint, Sparkles, Star } from "lucide-react";
import "./DailyStats.css";

type Moment = {
  date: string;
  text: string;
  activityId?: string;
  category?: string;
  minutes?: number;
};

type Activity = {
  id: string;
  name: string;
  category: string;
};

type History = { moments: Moment[]; activities: Activity[] };
type DailyStatsProps = { selectedDate: Date };

const STORAGE = {
  moments: "hot-girl-moments",
  activities: "hot-girl-activities"
} as const;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function isMoment(value: unknown): value is Moment {
  return isObject(value) && typeof value.date === "string" && typeof value.text === "string";
}

function isActivity(value: unknown): value is Activity {
  return isObject(value) && typeof value.id === "string" &&
    typeof value.name === "string" && typeof value.category === "string";
}

function readArray<T>(key: string, isValid: (item: unknown) => item is T): T[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value.filter(isValid) : [];
  } catch {
    return [];
  }
}

function readHistory(): History {
  return {
    moments: readArray(STORAGE.moments, isMoment),
    activities: readArray(STORAGE.activities, isActivity)
  };
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatMinutes(minutes: number): string {
  const total = Math.round(minutes);
  if (total < 60) return `${total} min`;

  const hours = Math.floor(total / 60);
  const remainder = total % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function DailyStats({ selectedDate }: DailyStatsProps) {
  const [history, setHistory] = useState<History>(readHistory);

  useEffect(() => {
    const refresh = () => setHistory(readHistory());
    window.addEventListener("hgo-history-updated", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("hgo-history-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const selectedKey = dateKey(selectedDate);

  const counts = useMemo(() => {
    const byId = new Map(history.activities.map(activity => [activity.id, activity.category]));
    const byName = new Map(history.activities.map(activity => [activity.name.toLowerCase(), activity.category]));

    const result = { moments: 0, minutes: 0, avery: 0, care: 0, home: 0, fun: 0 };

    for (const moment of history.moments) {
      if (moment.date !== selectedKey) continue;
      result.moments += 1;

      const category = moment.category ||
        (moment.activityId ? byId.get(moment.activityId) : undefined) ||
        byName.get(moment.text.toLowerCase()) || "Other";

      switch (category) {
        case "Avery": result.avery += 1; break;
        case "Self-care": result.care += 1; break;
        case "Home": result.home += 1; break;
        case "Fun": result.fun += 1; break;
      }

      if (category === "Movement" || (category === "Avery" && /walk/i.test(moment.text))) {
        const minutes = moment.minutes;
        if (typeof minutes === "number" && Number.isFinite(minutes) && minutes > 0) {
          result.minutes += minutes;
        }
      }
    }

    return result;
  }, [history, selectedKey]);

  const stats = [
    { label: "Tings Logged Today", value: counts.moments, icon: Heart, color: "rose" },
    { label: "Time Spent in Motion", value: formatMinutes(counts.minutes), icon: Clock3, color: "peach" },
    { label: "Bestie Moments with Avery", value: counts.avery, icon: PawPrint, color: "mint" },
    { label: "Baddie Maintenance Buffs", value: counts.care, icon: Sparkles, color: "blue" },
    { label: "Domestic Queen Duties", value: counts.home, icon: House, color: "lavender" },
    { label: "Silly Stacks", value: counts.fun, icon: Star, color: "pink" },
  ] as const;

  return (
    <section className="daily-stats" aria-label="Daily statistics">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div className={`stat-card ${color}`} key={label}>
          <span className="stat-icon" aria-hidden="true"><Icon size={18} /></span>
          <strong className="stat-number">{value}</strong>
          <span className="stat-subtitle">{label}</span>
        </div>
      ))}
    </section>
  );
}

export default DailyStats;
