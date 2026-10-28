import { useEffect, useState } from "react";
import { Heart, X } from "lucide-react";
import "./MoodBoard.css";

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
  { value: "amazing", label: "mogging", symbol: "✦" },
  { value: "good", label: "absolutely based", symbol: "♡" },
  { value: "calm", label: "unbothered queen", symbol: "☁" },
  { value: "meh", label: "mid", symbol: "⋯" },
  { value: "anxious", label: "negative aura", symbol: "⚡" },
  { value: "rough", label: "chopped asf", symbol: "☂" }
];

const energyLevels: {
  value: Energy;
  label: string;
  description: string;
}[] = [
  {
    value: "low",
    label: "Low",
    description: "Cooked"
  },
  {
    value: "medium",
    label: "Medium",
    description: "6-7"
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

          <h2>
            Vibe Check <span>♡</span>
          </h2>

          <p className="moodboard-description">
            fr how we doin
          </p>
        </div>

        <div className="moodboard-icon">
          <Heart size={21} />
        </div>
      </div>

      {/* Mood */}

      <div className="moodboard-section">

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
          <h3 className="battery-heading">
            Bat
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="2" y="7" width="18" height="10" rx="2" />
              <path d="M22 11v2" />
              <path d="M6 10h8v4H6z" fill="currentColor" stroke="none" />
            </svg>
          </h3>
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
          <h3>Trauma Dump</h3>
          <span>OPTIONAL</span>
        </div>

        <textarea
          className="moodboard-note"
          rows={3}
          placeholder="say your piece, diva"
          value={entry.note ?? ""}
          onChange={event =>
            updateEntry({ note: event.target.value })
          }
        />
      </div>

      <p className="moodboard-footer">
        {hasEntry
          ? "certified yapper ♡"
          : "chat i'm going non-verbal"}
      </p>

    </section>
  );
}

export default Moodboard;