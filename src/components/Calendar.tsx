import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./Calendar.css";

type CalendarProps = {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
};

type Moment = {
  id: string;
  date: string;
};

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function Calendar({ selectedDate, onDateSelect }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  const [moments, setMoments] = useState<Moment[]>([]);

  // Load your existing activity history.
  useEffect(() => {
    function refresh() {
      try {
        setMoments(
          JSON.parse(localStorage.getItem("hot-girl-moments") || "[]")
        );
      } catch {
        setMoments([]);
      }
    }

    refresh();

    window.addEventListener("hgo-history-updated", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("hgo-history-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  // Follow the selected date when another component changes it.
  useEffect(() => {
    setCurrentMonth(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    );
  }, [selectedDate]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Build complete calendar weeks, including neighbouring months.
  const calendarDays = useMemo(() => {
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7;

    const start = new Date(year, month, 1 - offset);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;

    return Array.from({ length: totalCells }, (_, index) => {
      return new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate() + index
      );
    });
  }, [year, month]);

  function changeMonth(amount: number) {
    setCurrentMonth(new Date(year, month + amount, 1));
  }

  function goToToday() {
    const today = new Date();

    setCurrentMonth(
      new Date(today.getFullYear(), today.getMonth(), 1)
    );

    onDateSelect(today);
  }

  function momentCount(date: Date) {
    const key = dateKey(date);

    return moments.filter(moment => moment.date === key).length;
  }

  const todayKey = dateKey(new Date());
  const selectedKey = dateKey(selectedDate);

  return (
    <section className="calendar">

      <div className="calendar-header">
        <div>
          <p className="calendar-eyebrow">
            larping timeline
          </p>

          <h2>
            {currentMonth.toLocaleDateString("en-CA", {
              month: "long",
              year: "numeric",
            })}
          </h2>
        </div>

        <div className="calendar-navigation">
          <button
            onClick={() => changeMonth(-1)}
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>

          <button onClick={goToToday} className="calendar-today-button">
            Today
          </button>

          <button
            onClick={() => changeMonth(1)}
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="calendar-weekdays">
        {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(day => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="calendar-grid">
        {calendarDays.map(date => {
          const key = dateKey(date);
          const count = momentCount(date);

          const outside = date.getMonth() !== month;
          const selected = key === selectedKey;
          const current = key === todayKey;

          return (
            <button
              key={key}
              onClick={() => onDateSelect(date)}
              className={[
                "calendar-day",
                outside ? "outside" : "",
                selected ? "selected" : "",
                current ? "current" : "",
              ].join(" ")}
              aria-label={date.toDateString()}
              aria-pressed={selected}
            >
              <span className="calendar-day-number">
                {date.getDate()}
              </span>

              {count > 0 && (
                <span className="calendar-moments">
                  {count} {count === 1 ? "activity" : "activities"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="calendar-legend">
        <span>
          <i />
          Logged aura activity
        </span>
      </div>

    </section>
  );
}

export default Calendar;