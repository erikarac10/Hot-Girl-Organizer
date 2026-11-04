import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Check, Ghost, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import "./Activities.css";

type Activity = {
  id: string;
  name: string;
  emoji: string;
  category: string;
  defaultMinutes?: number;
  custom?: boolean;
};

type Moment = {
  id: string;
  date: string;
  text: string;
  emoji?: string;
  activityId?: string;
  category?: string;
  minutes?: number;
  note?: string;
  source?: "reminder";
};

type Props = {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
};

type Screen = "pick" | "log" | "activity";
type LogDraft = {
  activity: Activity | null;
  editingId: string | null;
  name: string;
  minutes: string;
  note: string;
};
type ActivityDraft = {
  editingId: string | null;
  name: string;
  emoji: string;
  category: string;
  minutes: string;
  note: string;
};

const MOMENTS_KEY = "hot-girl-moments";
const ACTIVITIES_KEY = "hot-girl-activities";
const HISTORY_EVENT = "hgo-history-updated";

const starterActivities: Activity[] = [
  { id: "avery-pee", name: "Avery morning pee", emoji: "🐾", category: "Avery" },
  { id: "avery-evening", name: "Avery evening pee", emoji: "🌙", category: "Avery" },
  { id: "avery-walk", name: "Walked Avery", emoji: "🐶", category: "Avery", defaultMinutes: 30 },
  { id: "avery-play", name: "Played with Avery", emoji: "🦴", category: "Avery" },
  { id: "avery-brush", name: "Combed Avery", emoji: "🪮", category: "Avery" },
  { id: "avery-teeth", name: "Brushed Avery’s teeth", emoji: "🪥", category: "Avery" },
  { id: "avery-nails", name: "Cut Avery's Nails", emoji: "💅", category: "Avery" },
  { id: "jog", name: "Went for a jog", emoji: "🏃", category: "Movement", defaultMinutes: 20 },
  { id: "workout", name: "Worked out", emoji: "💪", category: "Movement" },
  { id: "stretch", name: "Stretched", emoji: "🧘", category: "Movement" },
  { id: "walk", name: "Went for a walk", emoji: "🚶", category: "Movement" },
  { id: "dishes", name: "Washed dishes", emoji: "🫧", category: "Home" },
  { id: "dishwasher", name: "Loaded the dishwasher", emoji: "🍽️", category: "Home" },
  { id: "put-dishes-away", name: "Put dishes away", emoji: "🍽️", category: "Home" },
  { id: "vacuum-home", name: "Vacuumed the apartment", emoji: "🧹", category: "Home" },
  { id: "vacuum-couch", name: "Vacuumed the couch", emoji: "🛋️", category: "Home" },
  { id: "dust", name: "Dusted", emoji: "🪶", category: "Home" },
  { id: "made-bed", name: "Made the bed", emoji: "🛏️", category: "Home" },
  { id: "tidied", name: "Tidied up", emoji: "🧺", category: "Home" },
  { id: "organized", name: "Organized something", emoji: "🎀", category: "Home" },
  { id: "put-away", name: "Put things away", emoji: "🧺", category: "Home" },
  { id: "garbage", name: "Took out the garbage", emoji: "🗑️", category: "Home" },
  { id: "recycling", name: "Took out the recycling", emoji: "♻️", category: "Home" },
  { id: "clean-bathtub", name: "Cleaned the bathtub", emoji: "🛁", category: "Home" },
  { id: "clean-toilet", name: "Cleaned the toilet", emoji: "🚽", category: "Home" },
  { id: "clean-bathroom-sink", name: "Cleaned the bathroom sink", emoji: "🧽", category: "Home" },
  { id: "clean-mirrors", name: "Cleaned mirrors", emoji: "🪞", category: "Home" },
  { id: "clothes-laundry", name: "Clothes Laundry", emoji: "👚", category: "Home" },
  { id: "bedsheets-laundry", name: "Bedsheets Laundry", emoji: "🛏️", category: "Home" },
  { id: "couch-blankets", name: "Washed couch blankets", emoji: "🧸", category: "Home" },
  { id: "bathroom-towels", name: "Washed bathroom towels", emoji: "🧼", category: "Home" },
  { id: "mop-floor", name: "Mopped floor", emoji: "🪣", category: "Home" },
  { id: "sanitize-surfaces", name: "Sanitized Surfaces", emoji: "🧴", category: "Home" },
  { id: "clean-computer", name: "Cleaned computer", emoji: "🖥️", category: "Home" },
  { id: "shower", name: "Took a shower", emoji: "🛁", category: "Self-care" },
  { id: "hair", name: "Washed my hair", emoji: "🫧", category: "Self-care" },
  { id: "skin", name: "Did skincare", emoji: "🧴", category: "Self-care" },
  { id: "rest", name: "Made time to rest", emoji: "☁️", category: "Self-care" },
  { id: "games", name: "Played video games", emoji: "🎮", category: "Fun" },
  { id: "something-fun", name: "Did something fun", emoji: "🌸", category: "Fun" },
  { id: "creative", name: "Made something", emoji: "🎨", category: "Fun" },
  { id: "read", name: "Read something", emoji: "📖", category: "Fun" },
  { id: "out", name: "Went out", emoji: "🍓", category: "Fun" },
  { id: "email", name: "Took care of an email", emoji: "💌", category: "Life admin" },
  { id: "errand", name: "Ran an errand", emoji: "🛍️", category: "Life admin" }
];

const categories = ["Avery", "Movement", "Home", "Self-care", "Fun", "Life admin", "Other"];

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function fromDateKey(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  return dateKey(date) === value ? date : null;
}

function loadArray<T>(key: string, fallback: T[], isValid: (value: unknown) => value is T): T[] {
  try {
    const saved = localStorage.getItem(key);
    if (saved === null) return fallback;
    const value: unknown = JSON.parse(saved);
    return Array.isArray(value) ? value.filter(isValid) : fallback;
  } catch {
    return fallback;
  }
}

function isActivity(value: unknown): value is Activity {
  if (!value || typeof value !== "object") return false;
  const activity = value as Partial<Activity>;
  return typeof activity.id === "string" && typeof activity.name === "string" &&
    typeof activity.emoji === "string" && typeof activity.category === "string";
}

function isMoment(value: unknown): value is Moment {
  if (!value || typeof value !== "object") return false;
  const moment = value as Partial<Moment>;
  return typeof moment.id === "string" && typeof moment.date === "string" &&
    typeof moment.text === "string";
}

function readMoments() { return loadArray(MOMENTS_KEY, [], isMoment); }

/** Merge new built-ins into existing libraries without erasing custom activities or history. */
function readActivities(): Activity[] {
  const saved = loadArray(ACTIVITIES_KEY, [], isActivity);
  if (!saved.length) return starterActivities;

  const byId = new Map(starterActivities.map(activity => [activity.id, activity]));
  const updated = saved.map(activity => {
    if (activity.custom) return activity;
    const current = byId.get(activity.id);
    if (!current) return activity;
    // Only migrate recognizable old built-in labels; never overwrite user edits.
    if (activity.id === "dishes" && activity.name === "Washed the dishes") {
      return { ...activity, name: current.name };
    }
    if (activity.id === "avery-nails" && activity.name === "Trimmed Avery’s nails") {
      return { ...activity, name: current.name, emoji: current.emoji };
    }
    if (activity.id === "dust" && activity.name === "Dusted" && activity.emoji === "✨") {
      return { ...activity, emoji: current.emoji };
    }
    return activity;
  });

  const ids = new Set(updated.map(activity => activity.id));
  const names = new Set(updated.map(activity => activity.name.trim().toLocaleLowerCase()));
  for (const activity of starterActivities) {
    if (!ids.has(activity.id) && !names.has(activity.name.toLocaleLowerCase())) {
      updated.push(activity);
    }
  }
  return updated;
}

function saveArray<T>(key: string, data: T[]) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* In-memory editing still works. */ }
  window.dispatchEvent(new Event(HISTORY_EVENT));
}

function validMinutes(input: string): number | undefined | null {
  if (!input.trim()) return undefined;
  const number = Number(input);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export default function Activities({ selectedDate }: Props) {
  const [moments, setMoments] = useState<Moment[]>(readMoments);
  const [activities, setActivities] = useState<Activity[]>(readActivities);
  const [screen, setScreen] = useState<Screen | null>(null);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Moment | null>(null);
  const [log, setLog] = useState<LogDraft>({ activity: null, editingId: null, name: "", minutes: "", note: "" });
  const [activityDraft, setActivityDraft] = useState<ActivityDraft>({
    editingId: null, name: "", emoji: "🌸", category: "Self-care", minutes: "", note: ""
  });

  const selectedKey = dateKey(selectedDate);
  const dayMoments = useMemo(() => moments.filter(moment => moment.date === selectedKey), [moments, selectedKey]);
  const filteredActivities = useMemo(() => activities.filter(activity =>
    activity.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
  ), [activities, search]);

  // One-time library upgrade: make new built-ins available to other components and backups.
  useEffect(() => {
    const stored = loadArray(ACTIVITIES_KEY, [], isActivity);
    const upgraded = readActivities();
    if (JSON.stringify(stored) !== JSON.stringify(upgraded)) {
      saveArray(ACTIVITIES_KEY, upgraded);
      setActivities(upgraded);
    }
  }, []);

  // Persist only user changes. Storage/restore updates must never write back.
  function commitMoments(update: (previous: Moment[]) => Moment[]): Moment[] {
    const previous = readMoments();
    const next = update(previous);
    saveArray(MOMENTS_KEY, next);
    setMoments(next);
    return previous;
  }

  function commitActivities(update: (previous: Activity[]) => Activity[]): void {
    const next = update(readActivities());
    saveArray(ACTIVITIES_KEY, next);
    setActivities(next);
  }

  // A completed reminder becomes a logged Life admin moment.
  useEffect(() => {
    function addCompletedReminder(event: Event) {
      const detail = (event as CustomEvent<{ title?: string; date?: string }>).detail;
      if (!detail?.title?.trim() || !detail.date || !fromDateKey(detail.date)) return;
      const reminder = detail as typeof detail & { reminderId?: string };
      const id = reminder.reminderId
        ? `reminder-${reminder.reminderId}-${detail.date}`
        : `reminder-${crypto.randomUUID()}`;
      const current = readMoments();
      // Recognize older random-ID reminder moments too.
      if (current.some(moment => moment.id === id || (
        moment.source === "reminder" && moment.date === detail.date &&
        moment.text === detail.title!.trim()
      ))) return;
      commitMoments(previous => [...previous, {
        id, date: detail.date!, text: detail.title!.trim(),
        emoji: "📌", category: "Life admin", source: "reminder"
      }]);
    }
    window.addEventListener("hgo-reminder-handled", addCompletedReminder);
    return () => window.removeEventListener("hgo-reminder-handled", addCompletedReminder);
  }, []);

  // Changes made in another tab of the same browser are reflected here.
  useEffect(() => {
    function sync(event: StorageEvent) {
      if (event.key === MOMENTS_KEY || event.key === null) setMoments(readMoments());
      if (event.key === ACTIVITIES_KEY || event.key === null) setActivities(readActivities());
    }
    const restore = () => {
      setMoments(readMoments());
      setActivities(readActivities());
      setScreen(null);
      setDeleteTarget(null);
    };
    window.addEventListener("storage", sync);
    window.addEventListener("hgo-data-restored", restore);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("hgo-data-restored", restore);
    };
  }, []);

  useEffect(() => {
    if (!screen && !deleteTarget) return;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (deleteTarget) setDeleteTarget(null);
      else setScreen(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [screen, deleteTarget]);

  function openPicker() {
    setSearch("");
    setLog({ activity: null, editingId: null, name: "", minutes: "", note: "" });
    setScreen("pick");
  }

  function chooseActivity(activity: Activity) {
    setLog(previous => ({ ...previous, activity, name: activity.name, minutes: String(activity.defaultMinutes ?? "") }));
    setScreen("log");
  }

  function editMoment(moment: Moment) {
    // Use the historical snapshot, not a possibly renamed library activity.
    setLog({
      activity: {
        id: moment.activityId ?? moment.id,
        name: moment.text,
        emoji: moment.emoji ?? "♡",
        category: moment.category ?? "Other"
      },
      editingId: moment.id,
      name: moment.text,
      minutes: String(moment.minutes ?? ""),
      note: moment.note ?? ""
    });
    setScreen("log");
  }

  /** New and custom activities share the same one-step logging flow. */
  function recordMoment(activity: Activity, title: string, minutesInput: string, note: string, editingId: string | null = null) {
    const name = title.trim();
    const duration = validMinutes(minutesInput);
    if (!name || duration === null) return;

    const original = readMoments().find(moment => moment.id === editingId);
    const moment: Moment = {
      id: editingId ?? crypto.randomUUID(),
      date: original?.date ?? selectedKey,
      text: name,
      emoji: activity.emoji,
      activityId: activity.id,
      category: activity.category,
      minutes: duration && duration > 0 ? duration : undefined,
      note: note.trim(),
      source: original?.source
    };
    const before = commitMoments(previous => editingId
      ? previous.map(item => item.id === editingId ? moment : item)
      : [...previous, moment]
    );
    window.dispatchEvent(new CustomEvent("hgo-moment-saved", { detail: { moment, before } }));
    setScreen(null);
  }

  function saveMoment() {
    if (log.activity) recordMoment(log.activity, log.name, log.minutes, log.note, log.editingId);
  }

  function openActivityEditor(activity?: Activity) {
    setActivityDraft({
      editingId: activity?.id ?? null,
      name: activity?.name ?? "",
      emoji: activity?.emoji ?? "🌸",
      category: activity?.category ?? "Self-care",
      minutes: String(activity?.defaultMinutes ?? ""),
      note: ""
    });
    setScreen("activity");
  }

  function saveActivity() {
    const duration = validMinutes(activityDraft.minutes);
    if (!activityDraft.name.trim() || duration === null) return;
    const activity: Activity = {
      id: activityDraft.editingId ?? crypto.randomUUID(),
      name: activityDraft.name.trim(),
      emoji: activityDraft.emoji.trim() || "🌸",
      category: activityDraft.category,
      custom: true,
      defaultMinutes: duration && duration > 0 ? duration : undefined
    };
    commitActivities(previous => activityDraft.editingId
      ? previous.map(item => item.id === activity.id ? activity : item)
      : [...previous, activity]
    );
    if (activityDraft.editingId) {
      setScreen("pick");
    } else {
      // Creating a new activity also logs it on the date already selected.
      recordMoment(activity, activity.name, activityDraft.minutes, activityDraft.note);
    }
  }

  function removeActivity(id: string) {
    if (!window.confirm("Remove this saved activity? Your activity history will stay.")) return;
    commitActivities(previous => previous.filter(activity => activity.id !== id));
  }

  function confirmRemoveMoment() {
    if (!deleteTarget) return;
    commitMoments(previous => previous.filter(moment => moment.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  const logMinutes = validMinutes(log.minutes);
  const activityMinutes = validMinutes(activityDraft.minutes);

  return (
    <section className="activities">
      <div className="activities-header">
        <div>
          <p className="activities-eyebrow">life lore just dropped</p>
          <h2>Aura Farming Activities <span className="activities-flower">✿</span></h2>
        </div>
        <button type="button" className="activities-add" onClick={openPicker}>
          <Plus size={16} /> Add Aura Gain
        </button>
      </div>

      {dayMoments.length === 0 ? (
        <div className="activities-empty">
          <span className="activities-heart">♡</span>
          <strong>zero rizz detected</strong>
          <p>prey mentality</p>
        </div>
      ) : (
        <div className="activities-list">
          {dayMoments.map(moment => (
            <div key={moment.id} className={`activities-entry${moment.source === "reminder" ? " from-reminder" : ""}`}>
              <div className="hgo-entry-content">
                <span className="hgo-entry-emoji">{moment.emoji ?? "♡"}</span>
                <div>
                  <strong>{moment.text}</strong>
                  {moment.source === "reminder" && <span className="activities-reminder-badge">✓ Completed reminder</span>}
                  {moment.minutes !== undefined && <small>{moment.minutes} minutes</small>}
                  {moment.note && <p>{moment.note}</p>}
                </div>
              </div>
              <div className="hgo-entry-actions">
                <button type="button" onClick={() => editMoment(moment)} aria-label={`Edit ${moment.text}`}>
                  <Pencil size={15} />
                </button>
                <button type="button" onClick={() => setDeleteTarget(moment)} aria-label={`Delete ${moment.text}`}>
                  <X size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteTarget && createPortal(
        <div className="hgo-overlay" onMouseDown={event => {
          if (event.target === event.currentTarget) setDeleteTarget(null);
        }}>
          <div className="hgo-modal activities-delete-modal" role="dialog" aria-modal="true" aria-labelledby="activities-delete-heading">
            <div className="activities-delete-ghost" aria-hidden="true">
              <Ghost size={43} strokeWidth={1.3} />
              <span className="ghost-sparkle ghost-sparkle-one">✦</span>
              <span className="ghost-sparkle ghost-sparkle-two">✧</span>
            </div>
            <h2 id="activities-delete-heading">Yeet this memory?</h2>
            <div className="activities-delete-preview">
              <span>{deleteTarget.emoji ?? "♡"}</span>
              <strong>{deleteTarget.text}</strong>
            </div>
            <p className="activities-delete-warning">will be sent to the shadowrealm</p>
            <div className="activities-delete-actions">
              <button type="button" className="activities-delete-cancel" autoFocus onClick={() => setDeleteTarget(null)}>Keep</button>
              <button type="button" className="activities-delete-confirm" onClick={confirmRemoveMoment}>
                <Trash2 size={15} strokeWidth={1.7} /> Girl bye
              </button>
            </div>
          </div>
        </div>, document.body
      )}

      {screen && createPortal(
        <div className="hgo-overlay" onMouseDown={event => {
          if (event.target === event.currentTarget) setScreen(null);
        }}>
          <div className="hgo-modal" role="dialog" aria-modal="true" aria-labelledby="activities-editor-heading">
            <div className="hgo-modal-heading">
              <h2 id="activities-editor-heading">
                {screen === "activity"
                  ? activityDraft.editingId ? "Edit saved activity" : "Add Aura Gain"
                  : screen === "log" ? log.editingId ? "Edit Aura" : "Add Aura Gain" : "Add Aura Gain"}
                <span> ✿</span>
              </h2>
              <button type="button" className="hgo-icon-button" onClick={() => setScreen(null)} aria-label="Close editor">
                <X size={19} />
              </button>
            </div>

            {screen === "pick" && <>
              <div className="hgo-search">
                <Search size={17} aria-hidden="true" />
                <input autoFocus type="search" placeholder="what were we farming?" aria-label="Search activities"
                  value={search} onChange={event => setSearch(event.target.value)} />
              </div>
              <div className="hgo-activity-list">
                {filteredActivities.map(activity => (
                  <div className="hgo-activity-option" key={activity.id}>
                    <button type="button" className="hgo-select-activity" onClick={() => chooseActivity(activity)}>
                      <span className="hgo-activity-emoji">{activity.emoji}</span>
                      <span>{activity.name}</span>
                      <Plus size={16} aria-hidden="true" />
                    </button>
                    {activity.custom && <div className="hgo-custom-actions">
                      <button type="button" onClick={() => openActivityEditor(activity)} aria-label={`Edit ${activity.name}`}>
                        <Pencil size={14} />
                      </button>
                      <button type="button" className="activity-delete-button" onClick={() => removeActivity(activity.id)}
                        aria-label={`Delete ${activity.name}`}>
                        <Ghost size={16} strokeWidth={1.6} />
                      </button>
                    </div>}
                  </div>
                ))}
                {filteredActivities.length === 0 && <p className="hgo-no-results">No matching activities. Make your own below!</p>}
              </div>
              <button type="button" className="hgo-create-link" onClick={() => openActivityEditor()}>
                + New Aura Farming Method
              </button>
            </>}

            {screen === "log" && log.activity && <>
              <div className="hgo-chosen">
                <span>{log.activity.emoji}</span>
                <strong>{log.editingId ? "Edit logged activity" : log.activity.name}</strong>
                {!log.editingId && <button type="button" onClick={() => setScreen("pick")}>Change</button>}
              </div>
              
              {log.editingId && <label className="hgo-label">Activity name
                <input autoFocus value={log.name} onChange={event => setLog(previous => ({ ...previous, name: event.target.value }))} />
              </label>}
              <label className="hgo-label">Minutes <small>(optional)</small>
                <input type="number" min="0" step="1" placeholder="e.g. 30" value={log.minutes}
                  onChange={event => setLog(previous => ({ ...previous, minutes: event.target.value }))} />
              </label>
              <label className="hgo-label">Note <small>(optional)</small>
                <textarea rows={4} placeholder="Closing TED Talk" value={log.note}
                  onChange={event => setLog(previous => ({ ...previous, note: event.target.value }))} />
              </label>
              <div className="hgo-modal-actions">
                <button type="button" onClick={() => setScreen(null)}>Cancel</button>
                <button type="button" className="hgo-primary" disabled={!log.name.trim() || logMinutes === null} onClick={saveMoment}>
                  <Check size={16} /> Slay & Save
                </button>
              </div>
            </>}

            {screen === "activity" && <>
              <label className="hgo-label">Activity name
                <input autoFocus placeholder="e.g. 69-step skincare routine" value={activityDraft.name}
                  onChange={event => setActivityDraft(previous => ({ ...previous, name: event.target.value }))} />
              </label>
              <div className="hgo-fields">
                <label>Emoji
                  <input value={activityDraft.emoji} maxLength={8}
                    onChange={event => setActivityDraft(previous => ({ ...previous, emoji: event.target.value }))} />
                </label>
                <label>Category
                  <select value={activityDraft.category}
                    onChange={event => setActivityDraft(previous => ({ ...previous, category: event.target.value }))}>
                    {categories.map(category => <option key={category} value={category}>{category}</option>)}
                  </select>
                </label>
              </div>
              <label className="hgo-label">{activityDraft.editingId ? "Usual minutes" : "Minutes"} <small>(optional)</small>
                <input type="number" min="0" step="1" placeholder="e.g. 20" value={activityDraft.minutes}
                  onChange={event => setActivityDraft(previous => ({ ...previous, minutes: event.target.value }))} />
              </label>
              {!activityDraft.editingId && <label className="hgo-label">Note <small>(optional)</small>
                <textarea rows={4} placeholder="Closing TED Talk" value={activityDraft.note}
                  onChange={event => setActivityDraft(previous => ({ ...previous, note: event.target.value }))} />
              </label>}
              <div className="hgo-modal-actions">
                <button type="button" onClick={() => setScreen("pick")}><ArrowLeft size={15} /></button>
                <button type="button" className="hgo-primary" disabled={!activityDraft.name.trim() || activityMinutes === null} onClick={saveActivity}>
                  <Check size={16} /> {activityDraft.editingId ? "Save activity" : "Slay & Save"}
                </button>
              </div>
            </>}
          </div>
        </div>, document.body
      )}
    </section>
  );
}