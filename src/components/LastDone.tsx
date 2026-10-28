import { useEffect, useState } from "react";
import { History, Search, ArrowUpRight } from "lucide-react";
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

type LastDoneProps = {
  onDateSelect: (date: Date) => void;
};

function loadSaved<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) as T : fallback;
  } catch {
    return fallback;
  }
}

function timeAgo(date?: string) {
  if (!date) return "Not logged yet";

  const [year, month, day] = date.split("-").map(Number);
  const today = new Date();

  const difference = Math.round(
    (
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) -
      Date.UTC(year, month - 1, day)
    ) / 86400000
  );

  if (difference === 0) return "Today";
  if (difference === 1) return "Yesterday";
  if (difference < 0) return "Future date";

  return `${difference} days ago`;
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(
    "en-CA",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}

function LastDone({ onDateSelect }: LastDoneProps) {
  const [activities, setActivities] = useState<Activity[]>(() =>
    loadSaved("hot-girl-activities", [])
  );

  const [moments, setMoments] = useState<Moment[]>(() =>
    loadSaved("hot-girl-moments", [])
  );

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Refresh whenever receipts change
  useEffect(() => {
    function refresh() {
      setActivities(loadSaved("hot-girl-activities", []));
      setMoments(loadSaved("hot-girl-moments", []));
    }

    window.addEventListener("hgo-history-updated", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("hgo-history-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  // Include saved activities and historical entries
  const activityMap = new Map<string, Activity>();

  activities.forEach(activity => {
    activityMap.set(activity.id, activity);
  });

  moments.forEach(moment => {
    const id = moment.activityId ?? `text:${moment.text.toLowerCase()}`;

    if (!activityMap.has(id)) {
      activityMap.set(id, {
        id,
        name: moment.text,
        emoji: moment.emoji ?? "♡",
      });
    }
  });

  const activityList = [...activityMap.values()];

  function getHistory(activity: Activity) {
    return moments
      .filter(moment =>
        moment.activityId === activity.id ||
        (!moment.activityId &&
          moment.text.toLowerCase() === activity.name.toLowerCase())
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  const results = search.trim()
    ? activityList
        .filter(activity =>
          activity.name.toLowerCase().includes(search.toLowerCase())
        )
        .slice(0, 4)
    : [];

  const selectedActivity = activityList.find(
    activity => activity.id === selectedId
  );

  const history = selectedActivity
    ? getHistory(selectedActivity)
    : [];

  function viewDate(date: string) {
    onDateSelect(new Date(`${date}T12:00:00`));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section className="last-done">

      {/* Heading */}

      <div className="last-done-heading">
        <div className="last-done-icon">
          <History size={20} />
        </div>

        <div>
          <p className="last-done-eyebrow">
            caught in 4k moments
          </p>

          <h2>When did I last…?</h2>
        </div>
      </div>

      {/* Search */}

      <div className="last-done-search">
        <Search size={17} />

        <input
          placeholder="e.g. touch grass"
          value={search}
          onChange={event => {
            setSearch(event.target.value);
            setSelectedId(null);
          }}
        />
      </div>

      {/* Search results */}

      {search.trim() && (
        <div className="last-done-results">
          {results.map(activity => {
            const lastDate = getHistory(activity)[0]?.date;

            return (
              <button
                key={activity.id}
                className="last-done-result"
                onClick={() =>
                  setSelectedId(
                    selectedId === activity.id ? null : activity.id
                  )
                }
              >
                <span>
                  {activity.emoji} {activity.name}
                </span>

                <strong>{timeAgo(lastDate)}</strong>
              </button>
            );
          })}

          {results.length === 0 && (
            <p className="last-done-no-results">
              No matching saved activities.
            </p>
          )}
        </div>
      )}

      {/* Expandable history */}

      {selectedActivity && (
        <div className="last-done-history">
          <p className="last-done-history-title">
            Previous receipts
          </p>

          {history.length === 0 ? (
            <p className="last-done-no-results">
              Nothing logged for this activity yet.
            </p>
          ) : (
            history.map(moment => (
              <button
                key={moment.id}
                onClick={() => viewDate(moment.date)}
                className="last-done-history-row"
              >
                <div>
                  <strong>{formatDate(moment.date)}</strong>

                  {moment.minutes !== undefined && (
                    <small>{moment.minutes} minutes</small>
                  )}

                  {moment.note && <p>{moment.note}</p>}
                </div>

                <ArrowUpRight size={15} />
              </button>
            ))
          )}
        </div>
      )}

    </section>
  );
}

export default LastDone;