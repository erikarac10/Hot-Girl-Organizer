import { useEffect, useState } from "react";
import { BookHeart, Plus, Check, Pencil, X } from "lucide-react";
import "./Reminders.css";

type Reminder = {
  id: string;
  text: string;
  done: boolean;
  date?: string;
  note?: string;
  completedOn?: string;
};

function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    try {
      const saved = localStorage.getItem("hot-girl-reminders");
      if (!saved) return [];

      // Also supports reminders saved by our previous component.
      const data = JSON.parse(saved);

      if (!Array.isArray(data)) return [];

        return data.map((item) => ({
        id: item.id,
        text: item.text ?? item.title ?? "",
        done: item.done ?? item.handled ?? false,
        date: item.date,
        note: item.note,
        completedOn: item.completedOn,
        }));
    } catch {
      return [];
    }
  });

  const [reminderText, setReminderText] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(
        "hot-girl-reminders",
        JSON.stringify(reminders)
    );

    window.dispatchEvent(new Event("hgo-reminders-updated"));
    }, [reminders]);

  function saveReminder() {
    if (!reminderText.trim()) return;

    if (editingId) {
      setReminders((previous) =>
        previous.map((reminder) =>
          reminder.id === editingId
            ? {
                ...reminder,
                text: reminderText.trim(),
                date: reminderDate || undefined,
              }
            : reminder
        )
      );
    } else {
      const reminder: Reminder = {
        id: crypto.randomUUID(),
        text: reminderText.trim(),
        done: false,
        date: reminderDate || undefined,
      };

      setReminders((previous) => [reminder, ...previous]);
    }

    cancelEdit();
  }

  function cancelEdit() {
    setReminderText("");
    setReminderDate("");
    setEditingId(null);
  }

  function editReminder(reminder: Reminder) {
    setReminderText(reminder.text);
    setReminderDate(reminder.date ?? "");
    setEditingId(reminder.id);
  }

    function toggleReminder(id: string) {
        const reminder = reminders.find(r => r.id === id);

        if (!reminder) return;

        const today = new Date();

        const completedOn = [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, "0"),
            String(today.getDate()).padStart(2, "0")
        ].join("-");

        const nowDone = !reminder.done;

        const countToday = reminders.filter(
            r => r.done && r.completedOn === completedOn
        ).length;

        // Find your previous best from other days
        const counts: Record<string, number> = {};

        reminders.forEach(r => {
            if (r.done && r.completedOn && r.completedOn !== completedOn) {
            counts[r.completedOn] = (counts[r.completedOn] || 0) + 1;
            }
        });

        const previousBest = Math.max(0, ...Object.values(counts));

        setReminders(previous =>
            previous.map(r =>
            r.id === id
                ? {
                    ...r,
                    done: nowDone,
                    completedOn: nowDone ? completedOn : undefined
                }
                : r
            )
        );

        if (nowDone) {
            window.dispatchEvent(
            new CustomEvent("hgo-reminder-handled", {
                detail: {
                title: reminder.text,
                date: completedOn,
                count: countToday + 1,
                previousBest
                }
            })
            );
        }
    }

  function deleteReminder(id: string) {
    setReminders((previous) =>
      previous.filter((reminder) => reminder.id !== id)
    );

    if (editingId === id) cancelEdit();
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

  const pending = reminders.filter((reminder) => !reminder.done);
  const completed = reminders.filter((reminder) => reminder.done);

  function renderReminder(reminder: Reminder) {
    return (
      <div className="reminder-row" key={reminder.id}>
        <button
          className={`reminder-circle ${
            reminder.done ? "checked" : ""
          }`}
          onClick={() => toggleReminder(reminder.id)}
          aria-label={
            reminder.done ? "Reopen reminder" : "Mark as handled"
          }
        >
          {reminder.done && <Check size={13} />}
        </button>

        <div className="reminder-text">
          {reminder.text}

          {reminder.date && (
            <small>{formatDate(reminder.date)}</small>
          )}

          {reminder.note && (
            <small>{reminder.note}</small>
          )}
        </div>

        <button
          className="reminder-icon-button"
          onClick={() => editReminder(reminder)}
          aria-label={`Edit ${reminder.text}`}
        >
          <Pencil size={15} />
        </button>

        <button
          className="reminder-icon-button"
          onClick={() => deleteReminder(reminder.id)}
          aria-label={`Delete ${reminder.text}`}
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <section className="reminders">
      {/* Heading */}

      <div className="reminders-heading">
        <div className="reminders-heading-icon">
          <BookHeart size={19} />
        </div>

        <div>
          <p className="reminders-eyebrow">
            working memory outsourcing
          </p>

          <h2>Remembermaxxing</h2>
        </div>
      </div>

      {/* Add reminder */}

      <form
        className="new-reminder"
        onSubmit={(event) => {
          event.preventDefault();
          saveReminder();
        }}
      >
        <input
          placeholder="e.g. schedule next crashout"
          value={reminderText}
          onChange={(event) => setReminderText(event.target.value)}
          aria-label="New reminder"
        />

        <button
          type="submit"
          disabled={!reminderText.trim()}
        >
          <Plus size={17} />
          {editingId ? "Save" : "Lock In"}
        </button>
      </form>

      {editingId && (
        <button
          className="cancel-reminder-edit"
          onClick={cancelEdit}
        >
          Cancel editing
        </button>
      )}

      {}

      <div className="reminder-divider" />

      {/* Pending reminders */}

      {pending.length > 0 ? (
        <div className="reminder-list">
          {pending.map(renderReminder)}
        </div>
      ) : (
        <div className="reminders-empty">
          <div className="reminders-empty-heart">♡</div>

          <strong>chat we might be free</strong>

          <p>we are so back (temporarily)</p>
        </div>
      )}

      {/* Completed reminders */}

      {completed.length > 0 && (
        <>
          <div className="reminder-divider" />

          <p className="reminders-eyebrow">
            Handled, Diva
          </p>

          <div className="reminder-list done-reminders">
            {completed.map(renderReminder)}
          </div>
        </>
      )}
    </section>
  );
}

export default Reminders;