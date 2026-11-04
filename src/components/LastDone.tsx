import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { ArrowUpRight, History, Search } from "lucide-react";
import FloatingCat from "./FloatingCat";
import "./LastDone.css";

type Activity = {
  id: string;
  name: string;
  emoji: string;
};

type Moment = {
  id: string;
  date: string;
  text: string;
  activityId?: string;
  emoji?: string;
  minutes?: number;
  note?: string;
};

type ActivityHistory = Activity & { moments: Moment[] };
type SavedHistory = { activities: Activity[]; moments: Moment[] };

type LastDoneProps = {
  onDateSelect: (date: Date) => void;
};

const DAY_MS = 86_400_000;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

function readArray(key: string): unknown[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readHistory(): SavedHistory {
  const activities = readArray("hot-girl-activities")
    .filter((value): value is Record<string, unknown> =>
      isRecord(value) && typeof value.id === "string" && typeof value.name === "string"
    )
    .map(value => ({
      id: value.id as string,
      name: value.name as string,
      emoji: typeof value.emoji === "string" ? value.emoji : "♡"
    }));

  const moments = readArray("hot-girl-moments")
    .filter((value): value is Record<string, unknown> =>
      isRecord(value) && typeof value.id === "string" &&
      typeof value.date === "string" && typeof value.text === "string"
    )
    .map(value => ({
      id: value.id as string,
      date: value.date as string,
      text: value.text as string,
      activityId: typeof value.activityId === "string" ? value.activityId : undefined,
      emoji: typeof value.emoji === "string" ? value.emoji : undefined,
      minutes: typeof value.minutes === "number" && Number.isFinite(value.minutes)
        ? value.minutes : undefined,
      note: typeof value.note === "string" ? value.note : undefined
    }));

  return { activities, moments };
}

/** Use local calendar dates, then UTC day numbers to avoid daylight-saving errors. */
function parseDay(key: string): Date | null {
  const match = DATE_PATTERN.exec(key);
  if (!match) return null;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText) - 1;
  const day = Number(dayText);
  const date = new Date(year, month, day, 12);

  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day
    ? date : null;
}

function timeAgo(key?: string): string {
  if (!key) return "Not logged yet";
  const date = parseDay(key);
  if (!date) return "Not logged yet";

  const today = new Date();
  const days = Math.round((
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) -
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  ) / DAY_MS);

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return days < 0 ? "Future date" : `${days} days ago`;
}

function formatDate(key: string): string {
  const date = parseDay(key);
  return date ? dateFormatter.format(date) : key;
}

function buildActivityHistory({ activities, moments }: SavedHistory): ActivityHistory[] {
  const byId = new Map<string, ActivityHistory>();
  const byName = new Map<string, ActivityHistory>();
  const normalized = (name: string) => name.trim().toLowerCase();

  for (const activity of activities) {
    if (byId.has(activity.id)) continue;
    const item: ActivityHistory = { ...activity, moments: [] };
    byId.set(item.id, item);
    if (!byName.has(normalized(item.name))) byName.set(normalized(item.name), item);
  }

  // A deleted activity remains searchable through its logged moments.
  for (const moment of moments) {
    const nameKey = normalized(moment.text);
    let item = (moment.activityId && byId.get(moment.activityId)) || byName.get(nameKey);

    if (!item) {
      const id = moment.activityId ?? `text:${nameKey}`;
      item = byId.get(id);
      if (!item) {
        item = { id, name: moment.text, emoji: moment.emoji ?? "♡", moments: [] };
        byId.set(id, item);
        byName.set(nameKey, item);
      }
    }

    item.moments.push(moment);
  }

  for (const item of byId.values()) {
    item.moments.sort((first, second) => second.date.localeCompare(first.date));
  }

  return [...byId.values()];
}

export default function LastDone({ onDateSelect }: LastDoneProps) {
  const [saved, setSaved] = useState<SavedHistory>(readHistory);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setSaved(readHistory());
    window.addEventListener("hgo-history-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("hgo-history-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const activityList = useMemo(() => buildActivityHistory(saved), [saved]);
  const query = search.trim().toLowerCase();
  const results = query
    ? activityList.filter(activity => activity.name.toLowerCase().includes(query)).slice(0, 4)
    : [];
  const selectedActivity = activityList.find(activity => activity.id === selectedId);

  function viewDate(key: string) {
    const date = parseDay(key);
    if (!date) return;
    onDateSelect(date);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section className="last-done" aria-labelledby="last-done-title">
      <div className="last-done-heading">
        <div className="last-done-icon" aria-hidden="true">
          <History size={20} />
        </div>
        <div>
          <p className="last-done-eyebrow">caught in 4k moments</p>
          <h2 id="last-done-title">When did I last…?</h2>
        </div>
      </div>

      <label className="last-done-search">
        <Search size={17} aria-hidden="true" />
        <input
          type="search"
          aria-label="Search activity history"
          placeholder="e.g. touch grass"
          value={search}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setSearch(event.target.value);
            setSelectedId(null);
          }}
        />
      </label>

      <FloatingCat />

      {query && (
        <div className="last-done-results">
          {results.length === 0 ? (
            <p className="last-done-no-results">No matching saved activities.</p>
          ) : (
            results.map(activity => (
              <button
                type="button"
                key={activity.id}
                className="last-done-result"
                aria-expanded={selectedId === activity.id}
                onClick={() => setSelectedId(current =>
                  current === activity.id ? null : activity.id
                )}
              >
                <span>{activity.emoji} {activity.name}</span>
                <strong>{timeAgo(activity.moments[0]?.date)}</strong>
              </button>
            ))
          )}
        </div>
      )}

      {selectedActivity && (
        <div className="last-done-history">
          <p className="last-done-history-title">Activity history</p>
          {selectedActivity.moments.length === 0 ? (
            <p className="last-done-no-results">Nothing logged for this activity yet.</p>
          ) : (
            selectedActivity.moments.map(moment => (
              <button
                type="button"
                key={moment.id}
                className="last-done-history-row"
                onClick={() => viewDate(moment.date)}
              >
                <div>
                  <strong>{formatDate(moment.date)}</strong>
                  {moment.minutes !== undefined && (
                    <small>{moment.minutes} minutes</small>
                  )}
                  {moment.note && <p>{moment.note}</p>}
                </div>
                <ArrowUpRight size={15} aria-hidden="true" />
              </button>
            ))
          )}
        </div>
      )}
    </section>
  );
}
