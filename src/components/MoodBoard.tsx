import { useEffect, useState } from "react";
import { Heart, X } from "lucide-react";
import "./Moodboard.css";

type Mood =
  | "amazing"
  | "good"
  | "calm"
  | "meh"
  | "anxious"
  | "rough";

type Energy = "low" | "medium" | "high";

type MoodEntry = {
  mood?: Mood;
  energy?: Energy;
  note?: string;
};

type MoodHistory = Record<string, MoodEntry>;

type MoodboardProps = {
  selectedDate: Date;
};

const moods: {
  value: Mood;
  label: string;
  symbol: string;
}[] = [
  { value: "amazing", label: "Amazing", symbol: "✦" },
  { value: "good", label: "Good", symbol: "♡" },
  { value: "calm", label: "Calm", symbol: "☁" },
  { value: "meh", label: "Meh", symbol: "⋯" },
  { value: "anxious", label: "Anxious", symbol: "⚡" },
  { value: "rough", label: "Rough", symbol: "☂" }
];

const energyLevels: {
  value: Energy;
  label: string;
  description: string;
}[] = [
  {
    value: "low",
    label: "Low",
    description: "Running on fumes"
  },
  {
    value: "medium",
    label: "Medium",
    description: "We exist"
  },
  {
    value: "high",
    label: "High",
    description: "Unstoppable"
  }
];

function dateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function loadMoods(): MoodHistory {
  try {
    const saved = JSON.parse(
      localStorage.getItem("hot-girl-moodboard") || "{}"
    );

    return saved && typeof saved === "object" && !Array.isArray(saved)
      ? saved
      : {};
  } catch {
    return {};
  }
}

function Moodboard({ selectedDate }: MoodboardProps) {
  const [entries, setEntries] = useState<MoodHistory>(loadMoods);

  const selectedKey = dateKey(selectedDate);

  const entry = entries[selectedKey] ?? {};

  // Save everything automatically
    useEffect(() => {
        localStorage.setItem(
            "hot-girl-moodboard",
            JSON.stringify(entries)
        );

        window.dispatchEvent(new Event("hgo-mood-updated"));
    }, [entries]);

  function updateEntry(changes: Partial<MoodEntry>) {
    setEntries(previous => ({
      ...previous,
      [selectedKey]: {
        ...previous[selectedKey],
        ...changes
      }
    }));
  }

  function selectMood(mood: Mood) {
    updateEntry({
      mood: entry.mood === mood ? undefined : mood
    });
  }

  function selectEnergy(energy: Energy) {
    updateEntry({
      energy: entry.energy === energy ? undefined : energy
    });
  }

  function clearDay() {
    setEntries(previous => {
      const updated = { ...previous };
      delete updated[selectedKey];
      return updated;
    });
  }

  const hasEntry = Boolean(
    entry.mood ||
    entry.energy ||
    entry.note?.trim()
  );

  const dateLabel = selectedDate.toLocaleDateString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric"
  });

  return (
    <section className="moodboard">

      <div className="moodboard-header">
        <div>
          <p className="moodboard-eyebrow">
            A LITTLE CHECK-IN
          </p>

          <h2>
            Vibe Check <span>♡</span>
          </h2>

          <p className="moodboard-description">
            How's the main character doing?
          </p>
        </div>

        <div className="moodboard-icon">
          <Heart size={21} />
        </div>
      </div>

      <div className="moodboard-date">
        <span>{dateLabel}</span>

        {hasEntry && (
          <button
            type="button"
            className="moodboard-clear"
            onClick={clearDay}
          >
            <X size={13} />
            Clear day
          </button>
        )}
      </div>

      {/* Mood */}

      <div className="moodboard-section">
        <div className="moodboard-section-heading">
          <h3>Today's vibe</h3>
          <span>OPTIONAL</span>
        </div>

        <div className="moodboard-moods">
          {moods.map(mood => (
            <button
              type="button"
              key={mood.value}
              className={`moodboard-mood mood-${mood.value} ${
                entry.mood === mood.value ? "selected" : ""
              }`}
              onClick={() => selectMood(mood.value)}
              aria-pressed={entry.mood === mood.value}
            >
              <span className="moodboard-mood-symbol">
                {mood.symbol}
              </span>

              <span className="moodboard-mood-label">
                {mood.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Energy */}

      <div className="moodboard-section">
        <div className="moodboard-section-heading">
          <h3>Energy levels</h3>
          <span>OPTIONAL</span>
        </div>

        <div className="moodboard-energy">
          {energyLevels.map(level => (
            <button
              type="button"
              key={level.value}
              className={`moodboard-energy-option ${
                entry.energy === level.value ? "selected" : ""
              }`}
              onClick={() => selectEnergy(level.value)}
              aria-pressed={entry.energy === level.value}
            >
              <strong>{level.label}</strong>

              <small>{level.description}</small>
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}

      <div className="moodboard-section">
        <div className="moodboard-section-heading">
          <h3>Anything on your mind?</h3>
          <span>OPTIONAL</span>
        </div>

        <textarea
          className="moodboard-note"
          rows={3}
          placeholder="A thought, a feeling, a tiny piece of lore..."
          value={entry.note ?? ""}
          onChange={event =>
            updateEntry({ note: event.target.value })
          }
        />
      </div>

      <p className="moodboard-footer">
        {hasEntry
          ? "Saved to your little corner of the internet ♡"
          : "No need to explain yourself. Just vibes."}
      </p>

    </section>
  );
}

export default Moodboard;