import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./Calendar.css";

type Mood = "amazing" | "good" | "calm" | "meh" | "anxious" | "rough";
type Energy = "low" | "medium" | "high";

type MoodEntry = {
  mood?: Mood;
  energy?: Energy; // Older entries used labels instead of percentages.
  energyPercent?: number;
  note?: string;
};

type MoodHistory = Record<string, MoodEntry>;

type CalendarProps = {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
};

const STORAGE_KEY = "hot-girl-moodboard";
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MOOD_LABELS: Record<Mood, string> = {
  amazing: "Mogging",
  good: "Absolutely based",
  calm: "Unbothered queen",
  meh: "Mid",
  anxious: "Negative aura",
  rough: "Cooked",
};
const LEGACY_ENERGY: Record<Energy, number> = {
  low: 20,
  medium: 50,
  high: 80,
};

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthDays(year: number, month: number): Date[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const mondayOffset = (firstWeekday + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cellCount = Math.ceil((mondayOffset + daysInMonth) / 7) * 7;

  return Array.from({ length: cellCount }, (_, index) =>
    new Date(year, month, index - mondayOffset + 1)
  );
}

function loadMoods(): MoodHistory {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return saved !== null && typeof saved === "object" && !Array.isArray(saved)
      ? (saved as MoodHistory)
      : {};
  } catch {
    return {};
  }
}

function getEnergyPercent(entry?: MoodEntry): number | null {
  if (!entry) return null;

  const percent =
    typeof entry.energyPercent === "number" && Number.isFinite(entry.energyPercent)
      ? entry.energyPercent
      : entry.energy && entry.energy in LEGACY_ENERGY
        ? LEGACY_ENERGY[entry.energy]
        : null;

  return percent === null ? null : Math.max(0, Math.min(100, percent));
}

function Calendar({ selectedDate, onDateSelect }: CalendarProps) {
  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth();

  const [viewMonth, setViewMonth] = useState(
    () => new Date(selectedYear, selectedMonth, 1)
  );
  const [moods, setMoods] = useState<MoodHistory>(loadMoods);

  // Follow date changes from the sidebar, activities, or other components.
  useEffect(() => {
    setViewMonth(new Date(selectedYear, selectedMonth, 1));
  }, [selectedYear, selectedMonth]);

  // Moodboard broadcasts updates within this tab; storage covers other tabs.
  useEffect(() => {
    const refresh = () => setMoods(loadMoods());
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) refresh();
    };

    window.addEventListener("hgo-mood-updated", refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("hgo-mood-updated", refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const days = useMemo(() => getMonthDays(year, month), [year, month]);
  const todayKey = dateKey(new Date());
  const selectedKey = dateKey(selectedDate);
  const monthLabel = viewMonth.toLocaleDateString("en-CA", {
    month: "long",
    year: "numeric",
  });

  function changeMonth(amount: number) {
    setViewMonth(previous =>
      new Date(previous.getFullYear(), previous.getMonth() + amount, 1)
    );
  }

  return (
    <section className="calendar" aria-label="Calendar">
      <div className="calendar-header">
        <div className="calendar-heading">
          <p className="calendar-eyebrow">Six Seven</p>
          <h2>{monthLabel}</h2>
        </div>

        <div className="calendar-navigation">
          <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month">
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => changeMonth(1)} aria-label="Next month">
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="calendar-weekdays" aria-hidden="true">
        {WEEKDAYS.map(day => <span key={day}>{day}</span>)}
      </div>

      <div className="calendar-grid">
        {days.map(day => {
          const key = dateKey(day);
          const entry = moods[key];
          const mood = entry?.mood && entry.mood in MOOD_LABELS ? entry.mood : undefined;
          const energyPercent = getEnergyPercent(entry);
          const isSelected = key === selectedKey;
          const isToday = key === todayKey;
          const isOutside = day.getMonth() !== month;

          const description = [
            day.toLocaleDateString("en-CA", {
              weekday: "long", month: "long", day: "numeric", year: "numeric",
            }),
            mood ? MOOD_LABELS[mood] : "No mood recorded",
            energyPercent === null ? "No battery recorded" : `${energyPercent}% energy`,
          ].join(" • ");

          return (
            <button
              key={key}
              type="button"
              className={[
                "calendar-day",
                mood ? `mood-${mood} has-mood` : "mood-none",
                isSelected && "selected",
                isToday && "current",
                isOutside && "outside",
              ].filter(Boolean).join(" ")}
              onClick={() => onDateSelect(day)}
              aria-label={description}
              aria-pressed={isSelected}
              aria-current={isToday ? "date" : undefined}
              title={description}
            >
              {mood && energyPercent !== null && (
                <span
                  className="calendar-mood-fill"
                  style={{ height: `${energyPercent}%` }}
                  aria-hidden="true"
                />
              )}
              <span className="calendar-day-number" aria-hidden="true">
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
