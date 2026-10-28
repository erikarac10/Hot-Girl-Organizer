import { useEffect, useState } from "react";
import { Plus, Check, X, Heart } from "lucide-react";
import "./DailyRituals.css";

type Habit = {
  id: string;
  title: string;
  emoji: string;
  completed: string[];
};

type DailyRitualsProps = {
  selectedDate: Date;
};

const starterHabits: Habit[] = [
  { id: "water", title: "Drink water", emoji: "💧", completed: [] },
  { id: "movement", title: "Move my body", emoji: "🌷", completed: [] },
  { id: "reading", title: "Read a little", emoji: "📖", completed: [] },
  { id: "break", title: "Take a mindful break", emoji: "🧘", completed: [] },
];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function DailyRituals({ selectedDate }: DailyRitualsProps) {
  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const saved = localStorage.getItem("hot-girl-habits");
      return saved ? JSON.parse(saved) : starterHabits;
    } catch {
      return starterHabits;
    }
  });

  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("🌸");

  const selectedKey = dateKey(selectedDate);

  // Save habits and their history automatically
  useEffect(() => {
    localStorage.setItem("hot-girl-habits", JSON.stringify(habits));
  }, [habits]);

  // Check or uncheck a habit for the selected date
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

    // Only celebrate when checking something off
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

  function addHabit() {
    if (!title.trim()) return;

    const newHabit: Habit = {
      id: crypto.randomUUID(),
      title: title.trim(),
      emoji: emoji.trim() || "🌸",
      completed: [],
    };

    setHabits(previous => [...previous, newHabit]);

    setTitle("");
    setEmoji("🌸");
    setAdding(false);
  }

  function deleteHabit(id: string) {
    setHabits(previous =>
      previous.filter(habit => habit.id !== id)
    );
  }

  return (
    <section className="daily-rituals">

      {/* Heading */}

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

      {/* Habits */}

      <div className="rituals-list">
        {habits.map(habit => {
          const checked = habit.completed.includes(selectedKey);

          return (
            <div className="ritual-row" key={habit.id}>

              <span className="ritual-emoji">
                {habit.emoji}
              </span>

              <span className="ritual-title">
                {habit.title}
              </span>

              <button
                className="ritual-delete"
                onClick={() => deleteHabit(habit.id)}
                aria-label={`Delete ${habit.title}`}
              >
                <X size={15} />
              </button>

              <button
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

            </div>
          );
        })}
      </div>

      {/* Add new habit */}

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

          <button type="submit" disabled={!title.trim()}>
            <Check size={17} />
          </button>

          <button
            type="button"
            onClick={() => setAdding(false)}
          >
            <X size={17} />
          </button>
        </form>
      ) : (
        <button
          className="rituals-add"
          onClick={() => setAdding(true)}
        >
          <Plus size={17} />
          New Glazing Ritual
        </button>
      )}

    </section>
  );
}

export default DailyRituals;