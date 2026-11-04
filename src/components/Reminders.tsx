import { useEffect, useRef, useState } from "react";
import { BookHeart, Check, Pencil, Plus, X } from "lucide-react";
import "./Reminders.css";

type Reminder = {
  id: string;
  text: string;
  done: boolean;
  date?: string;
  note?: string;
  completedOn?: string;
};

type ReminderEvent = {
  title: string;
  date: string;
  count: number;
  previousBest: number;
};

const STORAGE_KEY = "hot-girl-reminders";
const UPDATE_EVENT = "hgo-reminders-updated";
const COMPLETED_EVENT = "hgo-reminder-handled";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function readReminders(): Reminder[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(saved)) return [];

    const ids = new Set<string>();
    return saved.flatMap((item: unknown): Reminder[] => {
      if (!isRecord(item)) return [];
      const text = typeof item.text === "string" ? item.text : item.title;
      if (typeof text !== "string" || !text.trim()) return [];

      let id = typeof item.id === "string" && item.id.trim() ? item.id : crypto.randomUUID();
      if (ids.has(id)) id = crypto.randomUUID();
      ids.add(id);

      return [{
        id,
        text,
        done: typeof item.done === "boolean" ? item.done : item.handled === true,
        ...(validDate(item.date) ? { date: item.date } : {}),
        ...(typeof item.note === "string" ? { note: item.note } : {}),
        ...(validDate(item.completedOn) ? { completedOn: item.completedOn } : {})
      }];
    });
  } catch {
    return [];
  }
}

function formatDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-CA", {
    month: "short", day: "numeric", year: "numeric"
  });
}

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>(readReminders);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function commitReminders(update: (previous: Reminder[]) => Reminder[]): void {
    const next = update(readReminders());
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Keep the current session usable when storage is unavailable.
    }
    setReminders(next);
    window.dispatchEvent(new Event(UPDATE_EVENT));
  }

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) setReminders(readReminders());
    };
    const restore = () => {
      setReminders(readReminders());
      resetEditor();
    };
    window.addEventListener("storage", sync);
    window.addEventListener("hgo-data-restored", restore);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("hgo-data-restored", restore);
    };
  }, []);

  useEffect(() => {
    if (editingId) inputRef.current?.focus();
  }, [editingId]);

  function resetEditor() {
    setDraft("");
    setEditingId(null);
  }

  function saveReminder() {
    const text = draft.trim();
    if (!text) return;

    commitReminders(previous => editingId
      ? previous.map(reminder => reminder.id === editingId ? { ...reminder, text } : reminder)
      : [{ id: crypto.randomUUID(), text, done: false }, ...previous]
    );
    resetEditor();
  }

  function editReminder(reminder: Reminder) {
    setDraft(reminder.text);
    setEditingId(reminder.id);
  }

  function toggleReminder(reminder: Reminder) {
    const current = readReminders();
    const latest = current.find(item => item.id === reminder.id);
    if (!latest) return;

    const today = dateKey(new Date());
    const done = !latest.done;
    commitReminders(previous => previous.map(item => item.id === latest.id
      ? { ...item, done, completedOn: done ? today : item.completedOn }
      : item
    ));

    // Only celebrate and archive the first completion of a reminder that day.
    if (!done || latest.completedOn === today) return;

    const otherDays = new Map<string, number>();
    let countToday = 1;
    for (const item of current) {
      if (!item.done || !item.completedOn || item.id === latest.id) continue;
      if (item.completedOn === today) countToday++;
      else otherDays.set(item.completedOn, (otherDays.get(item.completedOn) ?? 0) + 1);
    }

    const detail: ReminderEvent & { reminderId: string } = {
      reminderId: latest.id,
      title: latest.text,
      date: today,
      count: countToday,
      previousBest: Math.max(0, ...otherDays.values())
    };
    window.dispatchEvent(new CustomEvent(COMPLETED_EVENT, { detail }));
  }

  function deleteReminder(id: string) {
    commitReminders(previous => previous.filter(reminder => reminder.id !== id));
    if (editingId === id) resetEditor();
  }

  const pending = reminders.filter(reminder => !reminder.done);

  return (
    <section className="reminders" aria-labelledby="reminders-title">
      <div className="reminders-heading">
        <div className="reminders-heading-icon" aria-hidden="true"><BookHeart size={19} /></div>
        <div>
          <p className="reminders-eyebrow">working memory outsourcing</p>
          <h2 id="reminders-title">Remembermaxxing</h2>
        </div>
      </div>

      <form className="new-reminder" onSubmit={event => { event.preventDefault(); saveReminder(); }}>
        <div className="reminder-main-row">
          <input
            ref={inputRef}
            aria-label={editingId ? "Edit reminder" : "New reminder"}
            placeholder="e.g. schedule next crashout"
            value={draft}
            onChange={event => setDraft(event.target.value)}
          />
          <button type="submit" disabled={!draft.trim()}>
            <Plus size={17} aria-hidden="true" /> {editingId ? "Save" : "Lock In"}
          </button>
        </div>
      </form>

      {editingId && (
        <button type="button" className="cancel-reminder-edit" onClick={resetEditor}>
          Cancel editing
        </button>
      )}

      <div className="reminder-divider" aria-hidden="true" />

      {pending.length ? (
        <div className="reminder-list">
          {pending.map(reminder => (
            <div className="reminder-row" key={reminder.id}>
              <button
                type="button"
                className="reminder-circle"
                onClick={() => toggleReminder(reminder)}
                aria-label={`Mark ${reminder.text} as handled`}
              >
                <Check size={13} aria-hidden="true" />
              </button>

              <div className="reminder-text">
                {reminder.text}
                {reminder.date && <small>{formatDate(reminder.date)}</small>}
                {reminder.note && <small>{reminder.note}</small>}
              </div>

              <button type="button" className="reminder-icon-button" onClick={() => editReminder(reminder)}
                aria-label={`Edit ${reminder.text}`}>
                <Pencil size={15} aria-hidden="true" />
              </button>
              <button type="button" className="reminder-icon-button" onClick={() => deleteReminder(reminder.id)}
                aria-label={`Delete ${reminder.text}`}>
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="reminders-empty">
          <div className="reminders-empty-heart" aria-hidden="true">♡</div>
          <strong>chat we might be free</strong>
          <p>we are so back (temporarily)</p>
        </div>
      )}
    </section>
  );
}
