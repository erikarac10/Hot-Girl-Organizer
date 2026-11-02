import { useEffect, useState } from "react";
import type { PointerEvent as ReactPointerEvent, KeyboardEvent } from "react";
import { Heart } from "lucide-react";
import "./MoodBoard.css";

/* ========================================
   TYPES
======================================== */

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
  energyPercent?: number;
  note?: string;
};

type MoodHistory = Record<string, MoodEntry>;

type MoodboardProps = {
  selectedDate: Date;
};

/* ========================================
   MOOD OPTIONS
======================================== */

const moods: {
  value: Mood;
  label: string;
  symbol: string;
}[] = [
  { value: "amazing", label: "mogging", symbol: "✦" },
  { value: "good", label: "absolutely based", symbol: "♡" },
  { value: "calm", label: "unbothered queen", symbol: "🍃" },
  { value: "meh", label: "mid", symbol: "⋯" },
  { value: "anxious", label: "negative aura", symbol: "⚡︎" },
  { value: "rough", label: "cooked", symbol: "☁" }
];

/* ========================================
   STORAGE
======================================== */

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

/* ========================================
   BATTERY HELPERS
======================================== */

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getBatteryPercent(entry: MoodEntry): number | null {
  if (typeof entry.energyPercent === "number") {
    return clamp(entry.energyPercent);
  }

  // Convert previously saved energy levels
  switch (entry.energy) {
    case "low":
      return 20;
    case "medium":
      return 50;
    case "high":
      return 80;
    default:
      return null;
  }
}

function getEnergyLevel(percent: number): Energy {
  if (percent < 34) return "low";
  if (percent < 67) return "medium";
  return "high";
}

function getEnergyLabel(percent: number) {
  if (percent < 34) return "Cooked";
  if (percent < 67) return "6-7";
  return "Unstoppable";
}

/* ========================================
   COMPONENT
======================================== */

function Moodboard({ selectedDate }: MoodboardProps) {
  const [entries, setEntries] = useState<MoodHistory>(loadMoods);

  const selectedKey = dateKey(selectedDate);
  const entry = entries[selectedKey] ?? {};

  const batteryPercent = getBatteryPercent(entry);

  /* Save automatically */

  useEffect(() => {
    localStorage.setItem(
      "hot-girl-moodboard",
      JSON.stringify(entries)
    );

    window.dispatchEvent(new Event("hgo-mood-updated"));
  }, [entries]);

  /* Update selected date's entry */

  function updateEntry(changes: Partial<MoodEntry>) {
    setEntries(previous => ({
      ...previous,
      [selectedKey]: {
        ...previous[selectedKey],
        ...changes
      }
    }));
  }

  /* Select or deselect mood */

  function selectMood(mood: Mood) {
    updateEntry({
      mood: entry.mood === mood ? undefined : mood
    });
  }

  /* Set battery percentage */

  function setBatteryLevel(percent: number) {
    const value = clamp(percent);

    updateEntry({
      energyPercent: value,
      energy: getEnergyLevel(value)
    });
  }

  /* ========================================
     VERTICAL BATTERY DRAGGING
  ======================================== */

  function updateBatteryFromPointer(
    event: ReactPointerEvent<HTMLDivElement>
  ) {
    const rect = event.currentTarget.getBoundingClientRect();

    // Bottom = 0%, top = 100%
    const position = rect.bottom - event.clientY;

    const percent = clamp(
      (position / rect.height) * 100
    );

    setBatteryLevel(percent);
  }

  function handlePointerDown(
    event: ReactPointerEvent<HTMLDivElement>
  ) {
    event.currentTarget.setPointerCapture(event.pointerId);
    updateBatteryFromPointer(event);
  }

  function handlePointerMove(
    event: ReactPointerEvent<HTMLDivElement>
  ) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      updateBatteryFromPointer(event);
    }
  }

  /* Keyboard accessibility */

  function handleBatteryKeyDown(
    event: KeyboardEvent<HTMLDivElement>
  ) {
    const current = batteryPercent ?? 0;

    switch (event.key) {
      case "ArrowUp":
      case "ArrowRight":
        event.preventDefault();
        setBatteryLevel(current + 5);
        break;

      case "ArrowDown":
      case "ArrowLeft":
        event.preventDefault();
        setBatteryLevel(current - 5);
        break;

      case "Home":
        event.preventDefault();
        setBatteryLevel(0);
        break;

      case "End":
        event.preventDefault();
        setBatteryLevel(100);
        break;
    }
  }

  /* ========================================
     RENDER
  ======================================== */

  return (
    <section className="moodboard">

      {/* Header */}

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
          <Heart size={18} />
        </div>
      </div>

      {/* Six mood options */}

      <div className="moodboard-moods">
        {moods.map(mood => (
          <button
            type="button"
            key={mood.value}
            className={`moodboard-mood mood-${mood.value} ${entry.mood === mood.value ? "selected" : ""
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

      {/* Vertical battery */}

      {/* Vertical battery */}

      <div className="moodboard-battery-section">
        <div className="moodboard-battery-area">

          <div className="moodboard-battery">

            <div className="battery-terminal" />

            <div
              className="battery-body"
              role="slider"
              tabIndex={0}
              aria-label="Energy level"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={batteryPercent ?? 0}
              aria-orientation="vertical"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onKeyDown={handleBatteryKeyDown}
            >
              <div
                className="battery-fill"
                style={{
                  height: `${batteryPercent ?? 0}%`
                }}
              />
            </div>

          </div>

        </div>
      </div>

    </section>
  );
}

export default Moodboard;