import { useEffect, useState } from "react";
import "./Calendar.css";

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

type CalendarProps = {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
};

/* ========================================
   MOOD LABELS
======================================== */

const moodLabels: Record<Mood, string> = {
  amazing: "Mogging",
  good: "Absolutely based",
  calm: "Unbothered queen",
  meh: "Mid",
  anxious: "Negative aura",
  rough: "Cooked"
};

/* ========================================
   DATE HELPERS
======================================== */

function dateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function sameDay(first: Date, second: Date) {
  return dateKey(first) === dateKey(second);
}

function getMonthDays(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  const firstDay = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  // Monday = first day of the week
  const offset = (firstDay.getDay() + 6) % 7;

  const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    return new Date(year, monthIndex, index - offset + 1);
  });
}

/* ========================================
   STORAGE
======================================== */

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
   BATTERY LEVEL
======================================== */

function getEnergyPercent(entry?: MoodEntry): number | null {
  if (!entry) return null;

  if (
    typeof entry.energyPercent === "number" &&
    Number.isFinite(entry.energyPercent)
  ) {
    return Math.max(0, Math.min(100, entry.energyPercent));
  }

  // Compatibility with old Low / Medium / High entries
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

/* ========================================
   CALENDAR COMPONENT
======================================== */

function Calendar({ selectedDate, onDateSelect }: CalendarProps) {
  const [viewMonth, setViewMonth] = useState(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  const [moods, setMoods] = useState<MoodHistory>(loadMoods);

  const today = new Date();

  /* Follow selected dates from other components */

  useEffect(() => {
    setViewMonth(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    );
  }, [selectedDate]);

  /* Update when mood or battery changes */

useEffect(() => {
  function refreshMoods() {
    setMoods(loadMoods());
  }

  window.addEventListener("hgo-mood-updated", refreshMoods);
  window.addEventListener("storage", refreshMoods);

  return () => {
    window.removeEventListener("hgo-mood-updated", refreshMoods);
    window.removeEventListener("storage", refreshMoods);
  };
}, []);

  const calendarDays = getMonthDays(viewMonth);

  const monthLabel = viewMonth.toLocaleDateString("en-CA", {
    month: "long",
    year: "numeric"
  });

  return (
    <section className="calendar">

      {/* ========================================
          HEADER
      ======================================== */}

      <div className="calendar-header">
        <div>
          <p className="calendar-eyebrow">
            LITTLE MOMENTS THROUGH TIME
          </p>

          <h2>{monthLabel}</h2>
        </div>


      </div>

      {/* ========================================
          WEEKDAY LABELS
      ======================================== */}

      <div className="calendar-weekdays">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
          <span key={day}>{day}</span>
        ))}
      </div>

      {/* ========================================
          CALENDAR DAYS
      ======================================== */}

      <div className="calendar-grid">

        {calendarDays.map(day => {
          const key = dateKey(day);

          const moodEntry = moods[key];
          const mood = moodEntry?.mood;

          const energyPercent = getEnergyPercent(moodEntry);

          const isSelected = sameDay(day, selectedDate);
          const isToday = sameDay(day, today);

          const isOutside =
            day.getMonth() !== viewMonth.getMonth();

          const moodClass = mood
            ? `mood-${mood}`
            : "mood-none";

          const moodDescription = mood
            ? moodLabels[mood]
            : "No mood recorded";

          const energyDescription =
            energyPercent === null
              ? "No battery recorded"
              : `${energyPercent}% energy`;

          return (
            <button
              type="button"
              key={key}
              className={[
                "calendar-day",
                moodClass,
                mood ? "has-mood" : "",
                isSelected ? "selected" : "",
                isToday ? "current" : "",
                isOutside ? "outside" : ""
              ].filter(Boolean).join(" ")}
              onClick={() => onDateSelect(day)}
              aria-pressed={isSelected}
              title={[
                day.toLocaleDateString("en-CA", {
                  month: "long",
                  day: "numeric",
                  year: "numeric"
                }),
                moodDescription,
                energyDescription
              ].join(" • ")}
            >

{/* MOOD + ENERGY FILL */}

{energyPercent !== null && (
  <span
    className="calendar-mood-fill"
    style={{ height: `${energyPercent}%` }}
    aria-hidden="true"
  />
)}

              {/* DATE NUMBER */}

              <span className="calendar-day-number">
                {day.getDate()}
              </span>

            </button>
          );
        })}

      </div>

    </section>
  );
}

export default Calendar;