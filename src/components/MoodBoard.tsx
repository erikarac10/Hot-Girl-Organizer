import { useEffect, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Heart } from "lucide-react";
import "./MoodBoard.css";

type Mood = "amazing" | "good" | "calm" | "meh" | "anxious" | "rough";
type Energy = "low" | "medium" | "high";

type MoodEntry = {
  mood?: Mood;
  energy?: Energy; // Kept for older saved entries.
  energyPercent?: number;
  note?: string; // Preserve any historical notes.
};

type MoodHistory = Record<string, MoodEntry>;
type MoodboardProps = { selectedDate: Date };

const STORAGE_KEY = "hot-girl-moodboard";
const UPDATE_EVENT = "hgo-mood-updated";

const MOODS: ReadonlyArray<{ value: Mood; label: string; symbol: string }> = [
  { value: "amazing", label: "mogging", symbol: "✦" },
  { value: "good", label: "absolutely based", symbol: "♡" },
  { value: "calm", label: "unbothered queen", symbol: "🍃" },
  { value: "meh", label: "mid", symbol: "⋯" },
  { value: "anxious", label: "negative aura", symbol: "⚡︎" },
  { value: "rough", label: "cooked", symbol: "☁" }
];

const SPARKLES = ["✦", "✧", "✦", "·", "✧", "✦", "·"];
const SPARKLE_THRESHOLDS = [0, 0, 12, 27, 42, 58, 73];
const LEGACY_ENERGY: Record<Energy, number> = { low: 20, medium: 50, high: 80 };

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function loadMoods(): MoodHistory {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};

    // Ignore malformed entries without discarding other days' history.
    return Object.fromEntries(
      Object.entries(saved).filter(([, entry]) =>
        entry !== null && typeof entry === "object" && !Array.isArray(entry)
      )
    ) as MoodHistory;
  } catch {
    return {};
  }
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function batteryPercent(entry: MoodEntry): number | null {
  if (typeof entry.energyPercent === "number" && Number.isFinite(entry.energyPercent)) {
    return clampPercent(entry.energyPercent);
  }
  return entry.energy && entry.energy in LEGACY_ENERGY
    ? LEGACY_ENERGY[entry.energy]
    : null;
}

function energyLevel(percent: number): Energy {
  return percent < 34 ? "low" : percent < 67 ? "medium" : "high";
}

export default function Moodboard({ selectedDate }: MoodboardProps) {
  const [entries, setEntries] = useState<MoodHistory>(loadMoods);
  const selectedKey = dateKey(selectedDate);
  const entry = entries[selectedKey] ?? {};
  const currentBattery = entry.mood ? batteryPercent(entry) : null;
  const energy = currentBattery ?? 0;

  // Storage events and imports update state without echoing data back to storage.
  function commitEntries(next: MoodHistory): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Keep mood editing usable during the current session.
    }
    setEntries(next);
    window.dispatchEvent(new Event(UPDATE_EVENT));
  }

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) {
        setEntries(loadMoods());
      }
    };
    const restore = () => setEntries(loadMoods());
    window.addEventListener("storage", onStorage);
    window.addEventListener("hgo-data-restored", restore);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("hgo-data-restored", restore);
    };
  }, []);

  function selectMood(mood: Mood) {
    const current = entries[selectedKey] ?? {};
    commitEntries({
      ...entries,
      [selectedKey]: current.mood === mood
        ? { ...current, mood: undefined, energy: undefined, energyPercent: undefined }
        : { ...current, mood }
    });
  }

  function setBatteryLevel(percent: number) {
    const value = clampPercent(percent);
    const current = entries[selectedKey] ?? {};
    if (!current.mood || batteryPercent(current) === value) return;
    commitEntries({
      ...entries,
      [selectedKey]: { ...current, energyPercent: value, energy: energyLevel(value) }
    });
  }

  function updateFromPointer(event: PointerEvent<HTMLDivElement>) {
    if (!entry.mood) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.height) return;
    setBatteryLevel(((bounds.bottom - event.clientY) / bounds.height) * 100);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!entry.mood) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromPointer(event);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      updateFromPointer(event);
    }
  }

  function onBatteryKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!entry.mood) return;
    const steps: Record<string, number> = {
      ArrowUp: 5,
      ArrowRight: 5,
      ArrowDown: -5,
      ArrowLeft: -5
    };

    if (event.key in steps) {
      event.preventDefault();
      setBatteryLevel(energy + steps[event.key]);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setBatteryLevel(event.key === "Home" ? 0 : 100);
    }
  }

  return (
    <section className="moodboard">
      <div className="moodboard-header">
        <div>
          <h2>Vibe Check <span>♡</span></h2>
          <p className="moodboard-description">fr how we doin</p>
        </div>
        <div className="moodboard-icon" aria-hidden="true">
          <Heart size={18} />
        </div>
      </div>

      <div className="moodboard-moods" aria-label="Mood for selected date">
        {MOODS.map(({ value, label, symbol }) => (
          <button
            type="button"
            key={value}
            className={`moodboard-mood mood-${value}${entry.mood === value ? " selected" : ""}`}
            aria-pressed={entry.mood === value}
            onClick={() => selectMood(value)}
          >
            <span className="moodboard-mood-symbol" aria-hidden="true">{symbol}</span>
            <span className="moodboard-mood-label">{label}</span>
          </button>
        ))}
      </div>

      <div className="moodboard-battery-section">
        <div className="battery-sparkles" aria-hidden="true">
          {SPARKLES.map((symbol, index) => {
            const opacity = index < 2
              ? 0.35 + energy * 0.0055
              : Math.min(0.9, Math.max(0, (energy - SPARKLE_THRESHOLDS[index]) / 25) * 0.9);

            return (
              <span key={index} className="battery-sparkle" style={{ opacity }}>
                {symbol}
              </span>
            );
          })}
        </div>

        <div className="moodboard-battery-area">
          <div className="moodboard-battery">
            <div className="battery-terminal" aria-hidden="true" />
            <div
              className="battery-body"
              role="slider"
              tabIndex={entry.mood ? 0 : -1}
              aria-label="Energy level"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={energy}
              aria-valuetext={entry.mood ? `${energy}% energy` : "Select a mood first"}
              aria-orientation="vertical"
              aria-disabled={!entry.mood}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onKeyDown={onBatteryKeyDown}
            >
              <div className="battery-fill" style={{ height: `${energy}%` }} aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
