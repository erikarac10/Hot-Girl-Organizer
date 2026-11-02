import { useEffect, useState } from "react";
import { Plus, Check, X, Heart } from "lucide-react";
import "./DailyRituals.css";

/* ========================================
   TYPES
======================================== */

type Habit = {
  id: string;
  title: string;
  emoji: string;
  completed: string[];
  addedOn?: string;
  removedOn?: string;
};

type DailyRitualsProps = {
  selectedDate: Date;
};

/* ========================================
   DEFAULT DAILY ROUTINES
======================================== */

const starterHabits: Habit[] = [
  { id: "vyvanse", title: "Vyvanse", emoji: "💊", completed: [] },
  { id: "vacuum", title: "Vacuum", emoji: "🧹", completed: [] },
  { id: "vacuum-couch", title: "Vacuum couch", emoji: "🛋️", completed: [] },
  { id: "dust", title: "Dust", emoji: "🪶", completed: [] },
  { id: "shower", title: "Shower", emoji: "🚿", completed: [] },
  { id: "get-ready", title: "Get Ready", emoji: "👗", completed: [] },
  { id: "avery-walk", title: "Avery Morning Walk", emoji: "🐕", completed: [] },
];

/* ========================================
   DATE HELPERS
======================================== */

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/* ========================================
   COMPONENT
======================================== */

function DailyRituals({ selectedDate }: DailyRitualsProps) {

  /* ========================================
     STATE
  ======================================== */

  const [habits, setHabits] = useState<Habit[]>(() => {
    const today = dateKey(new Date());

    const newDefaults = () =>
      starterHabits.map(habit => ({
        ...habit,
        addedOn: today
      }));

    try {
      const saved = localStorage.getItem("hot-girl-habits");

      if (!saved) return newDefaults();

      const previous: Habit[] = JSON.parse(saved);

      if (!Array.isArray(previous)) return newDefaults();

      // New routines already initialized
      if (previous.some(habit => habit.id === "avery-walk")) {
        return previous;
      }

      // Archive old starter routines without deleting history
      const oldIds = new Set([
        "water",
        "movement",
        "reading",
        "break"
      ]);

      const seen = new Set<string>();

      const archived = previous.map(habit => {
        const originalId = habit.id;

        const id = seen.has(originalId)
          ? crypto.randomUUID()
          : originalId;

        seen.add(originalId);

        return {
          ...habit,
          id,
          ...(oldIds.has(originalId) && !habit.removedOn
            ? { removedOn: today }
            : {})
        };
      });

      return [...archived, ...newDefaults()];

    } catch {
      return newDefaults();
    }
  });

  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("🌸");

  // Activity currently awaiting deletion confirmation
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const selectedKey = dateKey(selectedDate);

  /* ========================================
     VISIBLE ROUTINES FOR SELECTED DATE
  ======================================== */

  const visibleHabits = habits.filter(habit => {
    const hasStarted =
      !habit.addedOn || habit.addedOn <= selectedKey;

    const hasNotEnded =
      !habit.removedOn || selectedKey < habit.removedOn;

    return hasStarted && hasNotEnded;
  });

  /* ========================================
     SAVE HISTORY
  ======================================== */

  useEffect(() => {
    localStorage.setItem(
      "hot-girl-habits",
      JSON.stringify(habits)
    );
  }, [habits]);

  /* ========================================
     CHECK / UNCHECK
  ======================================== */

  function toggleHabit(id: string) {
    const habit = habits.find(h => h.id === id);

    if (!habit) return;

    const alreadyChecked = habit.completed.includes(selectedKey);

    setHabits(previous =>
      previous.map(h => {
        if (h.id !== id) return h;

        return {
          ...h,
          completed: alreadyChecked
            ? h.completed.filter(date => date !== selectedKey)
            : [...h.completed, selectedKey]
        };
      })
    );

    // Celebrate only when checking something off
    if (!alreadyChecked) {
      window.dispatchEvent(
        new CustomEvent("hgo-ritual-checked", {
          detail: {
            title: habit.title,
            date: selectedKey,
            completed: [...habit.completed, selectedKey]
          }
        })
      );
    }
  }

  /* ========================================
     ADD DAILY ROUTINE
  ======================================== */

  function addHabit() {
    if (!title.trim()) return;

    const newHabit: Habit = {
      id: crypto.randomUUID(),
      title: title.trim(),
      emoji: emoji.trim() || "🌸",
      completed: [],
      addedOn: dateKey(new Date())
    };

    setHabits(previous => [...previous, newHabit]);

    setTitle("");
    setEmoji("🌸");
    setAdding(false);
  }

  /* ========================================
     RETIRE DAILY ROUTINE
  ======================================== */

  function deleteHabit(id: string) {
    const today = dateKey(new Date());

    setHabits(previous =>
      previous.map(habit =>
        habit.id === id
          ? { ...habit, removedOn: today }
          : habit
      )
    );

    setPendingDelete(null);
  }

  /* ========================================
     RENDER
  ======================================== */

  return (
    <section className="daily-rituals">

      {/* ========================================
          HEADING
      ======================================== */}

      <div className="rituals-header">

        <div>
          <h2>
            Daily RoutineMaxxing <span>♡</span>
          </h2>

          <p>mewing maintenance</p>
        </div>

        <div className="rituals-header-icon">
          <Heart size={19} />
        </div>

      </div>

      {/* ========================================
          DAILY ROUTINES
      ======================================== */}

      <div className="rituals-list">

        {visibleHabits.map(habit => {
          const checked = habit.completed.includes(selectedKey);

          return (
            <div className="ritual-row" key={habit.id}>

              {/* Emoji */}

              <span className="ritual-emoji">
                {habit.emoji}
              </span>

              {/* Activity name */}

              <span className="ritual-title">
                {habit.title}
              </span>

              {/* ========================================
                  INLINE DELETE CONFIRMATION
              ======================================== */}

              {pendingDelete === habit.id ? (

                <div className="ritual-delete-inline">

                  <button
                    type="button"
                    className="ritual-delete-cancel"
                    onClick={() => setPendingDelete(null)}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="ritual-delete-confirm"
                    onClick={() => deleteHabit(habit.id)}
                  >
                    Remove
                  </button>

                </div>

              ) : (

                <>

                  {/* Delete button */}

                  <button
                    type="button"
                    className="ritual-delete"
                    onClick={() => setPendingDelete(habit.id)}
                    aria-label={`Remove ${habit.title}`}
                  >
                    <X size={15} />
                  </button>

                  {/* Checkbox */}

                  <button
                    type="button"
                    className={`ritual-check ${checked ? "checked" : ""}`}
                    onClick={() => toggleHabit(habit.id)}
                    aria-label={
                      checked
                        ? `Uncheck ${habit.title}`
                        : `Check ${habit.title}`
                    }
                    aria-pressed={checked}
                  >
                    {checked && <Check size={16} />}
                  </button>

                </>

              )}

            </div>
          );
        })}

      </div>

      {/* ========================================
          ADD NEW DAILY ROUTINE
      ======================================== */}

      {adding ? (

        <form
          className="rituals-form"
          onSubmit={event => {
            event.preventDefault();
            addHabit();
          }}
        >

          <input
            className="ritual-emoji-input"
            value={emoji}
            onChange={event => setEmoji(event.target.value)}
            aria-label="Habit emoji"
            maxLength={8}
          />

          <input
            className="ritual-name-input"
            autoFocus
            placeholder="New glazing ritual..."
            value={title}
            onChange={event => setTitle(event.target.value)}
          />

          <button
            type="submit"
            disabled={!title.trim()}
            aria-label="Save daily routine"
          >
            <Check size={17} />
          </button>

          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setTitle("");
              setEmoji("🌸");
            }}
            aria-label="Cancel adding"
          >
            <X size={17} />
          </button>

        </form>

      ) : (

        <button
          type="button"
          className="rituals-add"
          onClick={() => setAdding(true)}
        >
          <Plus size={13} />
          Add
        </button>

      )}

    </section>
  );
}

export default DailyRituals;