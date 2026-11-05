import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import "./Activities.css";

type Activity = {
  id: string;
  name: string;
  emoji: string;
  category: string;
  defaultMinutes?: number;
  defaultNote?: string;
  custom?: boolean;
  hidden?: boolean;
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

type EditorMode = "new" | "log" | "edit-template" | "edit-log";
type Draft = {
  mode: EditorMode;
  activityId: string | null;
  momentId: string | null;
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
  const [screen, setScreen] = useState<"pick" | "editor" | null>(null);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Moment | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const selectedKey = dateKey(selectedDate);
  const dayMoments = useMemo(
    () => moments.filter(moment => moment.date === selectedKey),
    [moments, selectedKey]
  );
  const filteredActivities = useMemo(
    () => activities.filter(activity =>
      !activity.hidden &&
      activity.name.toLowerCase().includes(search.trim().toLowerCase())
    ),
    [activities, search]
  );

  // Upgrade existing libraries with new built-in activities once, without erasing history.
  useEffect(() => {
    const stored = loadArray(ACTIVITIES_KEY, [], isActivity);
    const upgraded = readActivities();
    if (JSON.stringify(stored) !== JSON.stringify(upgraded)) {
      saveArray(ACTIVITIES_KEY, upgraded);
      setActivities(upgraded);
    }
  }, []);

  // Only actual edits write to storage; cross-tab and backup updates do not write back.
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

  useEffect(() => {
    function addCompletedReminder(event: Event) {
      const detail = (event as CustomEvent<{
        title?: string;
        date?: string;
        reminderId?: string;
      }>).detail;
      if (!detail?.title?.trim() || !detail.date || !fromDateKey(detail.date)) return;

      const title = detail.title.trim();
      const id = detail.reminderId
        ? `reminder-${detail.reminderId}-${detail.date}`
        : `reminder-${crypto.randomUUID()}`;
      const current = readMoments();
      if (current.some(moment => moment.id === id || (
        moment.source === "reminder" && moment.date === detail.date && moment.text === title
      ))) return;

      commitMoments(previous => [...previous, {
        id,
        date: detail.date!,
        text: title,
        emoji: "📌",
        category: "Life admin",
        source: "reminder"
      }]);
    }
    window.addEventListener("hgo-reminder-handled", addCompletedReminder);
    return () => window.removeEventListener("hgo-reminder-handled", addCompletedReminder);
  }, []);

  useEffect(() => {
    function sync(event: StorageEvent) {
      if (event.key === MOMENTS_KEY || event.key === null) setMoments(readMoments());
      if (event.key === ACTIVITIES_KEY || event.key === null) setActivities(readActivities());
    }
    function restore() {
      setMoments(readMoments());
      setActivities(readActivities());
      setScreen(null);
      setDraft(null);
      setDeleteTarget(null);
    }
    window.addEventListener("storage", sync);
    window.addEventListener("hgo-data-restored", restore);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("hgo-data-restored", restore);
    };
  }, []);

  useEffect(() => {
    if (!screen && !deleteTarget) return;
    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (deleteTarget) setDeleteTarget(null);
      else setScreen(null);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [screen, deleteTarget]);

  function openPicker() {
    setSearch("");
    setDraft(null);
    setScreen("pick");
  }

  function openEditor(mode: EditorMode, activity?: Activity, moment?: Moment) {
    setDraft({
      mode,
      activityId: moment?.activityId ?? activity?.id ?? null,
      momentId: moment?.id ?? null,
      name: moment?.text ?? activity?.name ?? "",
      emoji: moment?.emoji ?? activity?.emoji ?? "🌸",
      category: moment?.category ?? activity?.category ?? "Self-care",
      minutes: String(moment?.minutes ?? activity?.defaultMinutes ?? ""),
      note: moment?.note ?? activity?.defaultNote ?? ""
    });
    setScreen("editor");
  }

  function saveEditor() {
    if (!draft) return;
    const name = draft.name.trim();
    const minutes = validMinutes(draft.minutes);
    if (!name || minutes === null) return;

    const normalizedMinutes = minutes && minutes > 0 ? minutes : undefined;
    const note = draft.note.trim();
    const isTemplate = draft.mode === "edit-template";
    const isNewTemplate = draft.mode === "new";

    if (isTemplate) {
      if (!draft.activityId || !readActivities().some(a => a.id === draft.activityId)) return;
      commitActivities(previous => previous.map(activity =>
        activity.id === draft.activityId ? {
          ...activity,
          name,
          emoji: draft.emoji.trim() || "🌸",
          category: draft.category,
          defaultMinutes: normalizedMinutes,
          defaultNote: note || undefined
        } : activity
      ));
      setScreen("pick");
      return;
    }

    const activityId = isNewTemplate ? crypto.randomUUID() : draft.activityId;
    if (!activityId) return;

    if (isNewTemplate) {
      commitActivities(previous => [...previous, {
        id: activityId,
        name,
        emoji: draft.emoji.trim() || "🌸",
        category: draft.category,
        defaultMinutes: normalizedMinutes,
        defaultNote: note || undefined,
        custom: true
      }]);
    }

    const original = draft.mode === "edit-log"
      ? readMoments().find(moment => moment.id === draft.momentId)
      : undefined;
    if (draft.mode === "edit-log" && !original) return;

    const moment: Moment = {
      id: original?.id ?? crypto.randomUUID(),
      date: original?.date ?? selectedKey,
      text: name,
      emoji: draft.emoji.trim() || "🌸",
      activityId,
      category: draft.category,
      minutes: normalizedMinutes,
      note,
      source: original?.source
    };
    const before = commitMoments(previous => original
      ? previous.map(item => item.id === original.id ? moment : item)
      : [...previous, moment]
    );
    window.dispatchEvent(new CustomEvent("hgo-moment-saved", { detail: { moment, before } }));
    setScreen(null);
  }

  function removeActivity(id: string) {
    commitActivities(previous =>
      previous.flatMap(activity => {
        if (activity.id !== id) return [activity];

        return activity.custom
          ? []
          : [{ ...activity, hidden: true }];
      })
    );
  }

  function confirmRemoveMoment() {
    if (!deleteTarget) return;
    commitMoments(previous => previous.filter(moment => moment.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  const validDraftMinutes = draft ? validMinutes(draft.minutes) : null;
  const isEditing = draft?.mode === "edit-template" || draft?.mode === "edit-log";

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
                <button type="button" onClick={() => openEditor("edit-log", undefined, moment)} aria-label={`Edit ${moment.text}`}>
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
                {screen === "pick" ? "Add Aura Gain" : isEditing ? "Edit Aura" : "Add Aura Gain"}<span> ✿</span>
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
                    <button type="button" className="hgo-select-activity" onClick={() => openEditor("log", activity)}>
                      <span className="hgo-activity-emoji">{activity.emoji}</span>
                      <span>{activity.name}</span>
                    </button>
                    <div className="hgo-custom-actions">
                      {pendingDeleteId === activity.id ? (
                        <div className="hgo-inline-delete">

                          <button
                            type="button"
                            className="hgo-delete-yes"
                            onClick={() => {
                              removeActivity(activity.id);
                              setPendingDeleteId(null);
                            }}
                          >
                            Delete
                          </button>

                          <button
                            type="button"
                            className="hgo-delete-no"
                            onClick={() => setPendingDeleteId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => openEditor("edit-template", activity)}
                            aria-label={`Edit ${activity.name}`}
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            type="button"
                            className="hgo-delete-x"
                            onClick={() => setPendingDeleteId(activity.id)}
                            aria-label={`Delete ${activity.name}`}
                          >
                            <X size={13} strokeWidth={2} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {filteredActivities.length === 0 && <p className="hgo-no-results">No matching activities. Make your own below!</p>}
              </div>
              <button type="button" className="hgo-create-link" onClick={() => openEditor("new")}>
                + New Aura Farming Method
              </button>
            </>}

            {screen === "editor" && draft && <>
              <label className="hgo-label">Activity name
                <input autoFocus placeholder="e.g. 69-step skincare routine" value={draft.name}
                  onChange={event => setDraft(previous => previous && ({ ...previous, name: event.target.value }))} />
              </label>
              <div className="hgo-fields">
                <label>Emoji
                  <input value={draft.emoji} maxLength={8}
                    onChange={event => setDraft(previous => previous && ({ ...previous, emoji: event.target.value }))} />
                </label>
                <label>Category
                  <select value={draft.category}
                    onChange={event => setDraft(previous => previous && ({ ...previous, category: event.target.value }))}>
                    {categories.map(category => <option key={category} value={category}>{category}</option>)}
                  </select>
                </label>
              </div>
              <label className="hgo-label">{draft.mode === "edit-template" ? "Usual minutes" : "Minutes"} <small>(optional)</small>
                <input type="number" min="0" step="1" placeholder="e.g. 20" value={draft.minutes}
                  onChange={event => setDraft(previous => previous && ({ ...previous, minutes: event.target.value }))} />
              </label>
              <label className="hgo-label">{draft.mode === "edit-template" ? "Default note" : "Note"} <small>(optional)</small>
                <textarea rows={4} placeholder="Closing TED Talk" value={draft.note}
                  onChange={event => setDraft(previous => previous && ({ ...previous, note: event.target.value }))} />
              </label>
              <div className="hgo-modal-actions">
                <button type="button" onClick={() => setScreen(draft.mode === "edit-log" ? null : "pick")}>
                  {draft.mode === "edit-log" ? "Cancel" : "Back"}
                </button>
                <button type="button" className="hgo-primary"
                  disabled={!draft.name.trim() || validDraftMinutes === null}
                  onClick={saveEditor}>
                  <Check size={16} /> Slay & Save
                </button>
              </div>
            </>}
          </div>
        </div>, document.body
      )}
    </section>
  );
}
