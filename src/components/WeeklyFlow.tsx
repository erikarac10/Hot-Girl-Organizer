import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ChartNoAxesColumn } from "lucide-react";
import "./WeeklyFlow.css";

type Moment = {
  id: string;
  date: string;
};

type WeeklyFlowProps = {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
};

function dateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function loadMoments(): Moment[] {
  try {
    const saved = JSON.parse(
      localStorage.getItem("hot-girl-moments") || "[]"
    );

    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function WeeklyFlow({
  selectedDate,
  onDateSelect
}: WeeklyFlowProps) {
  const [moments, setMoments] = useState<Moment[]>(loadMoments);

  useEffect(() => {
    function refresh() {
      setMoments(loadMoments());
    }

    window.addEventListener("hgo-history-updated", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("hgo-history-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  // Start the week on Monday
  const monday = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
    12
  );

  const daysSinceMonday = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - daysSinceMonday);

  // Generate all seven days of the selected week
  const weekDates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });

  const counts = weekDates.map(date =>
    moments.filter(moment => moment.date === dateKey(date)).length
  );

  const maxCount = Math.max(1, ...counts);

  const totalMoments = counts.reduce((total, count) => total + count, 0);

  const daysWithMoments = counts.filter(count => count > 0).length;

  const todayKey = dateKey(new Date());
  const selectedKey = dateKey(selectedDate);

  const sunday = weekDates[6];

  const weekLabel = `${
    monday.toLocaleDateString("en-CA", {
      month: "short",
      day: "numeric"
    })
  } – ${
    sunday.toLocaleDateString("en-CA", {
      month: "short",
      day: "numeric"
    })
  }`;

  function changeWeek(amount: number) {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + amount * 7);
    onDateSelect(date);
  }

  return (
    <section className="weekly-flow">

      <div className="weekly-flow-header">
        <div>

          <h2>
            The Weekly Glaze <span>✧</span>
          </h2>
        </div>

        <div className="weekly-flow-icon">
          <ChartNoAxesColumn size={21} />
        </div>
      </div>

      <div className="weekly-flow-navigation">
        <button
          type="button"
          onClick={() => changeWeek(-1)}
          aria-label="Previous week"
        >
          <ChevronLeft size={18} />
        </button>

        <span>{weekLabel}</span>

        <button
          type="button"
          onClick={() => changeWeek(1)}
          aria-label="Next week"
        >
          <ChevronRight size={18} />
        </button>

        <button
          type="button"
          className="weekly-flow-today-button"
          onClick={() => onDateSelect(new Date())}
        >
          This week
        </button>
      </div>

      <div className="weekly-flow-chart">
        {weekDates.map((date, index) => {
          const count = counts[index];
          const key = dateKey(date);

          const isSelected = key === selectedKey;
          const isToday = key === todayKey;

          const height = count === 0
            ? 4
            : Math.max(8, (count / maxCount) * 100);

          return (
            <div
              className={`weekly-flow-day ${
                isSelected ? "selected" : ""
              }`}
              key={key}
            >
              <span className="weekly-flow-count">
                {count}
              </span>

              <div className="weekly-flow-track">
                <button
                  type="button"
                  className={`weekly-flow-bar ${
                    count === 0 ? "empty" : ""
                  } ${isToday ? "today" : ""}`}
                  style={{ height: `${height}%` }}
                  onClick={() => onDateSelect(new Date(date))}
                  title={`${count} moments on ${
                    date.toLocaleDateString("en-CA", {
                      month: "long",
                      day: "numeric"
                    })
                  }`}
                  aria-label={`Select ${
                    date.toLocaleDateString("en-CA", {
                      weekday: "long",
                      month: "long",
                      day: "numeric"
                    })
                  }, ${count} moments`}
                  aria-pressed={isSelected}
                />
              </div>

              <span className="weekly-flow-day-label">
                {date.toLocaleDateString("en-CA", {
                  weekday: "short"
                })}
              </span>

              <span className="weekly-flow-date">
                {date.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      <div className="weekly-flow-footer">
        <span>
          <strong>{totalMoments}</strong>{" aura "}
          {totalMoments === 1 ? "activity" : "activities"} 
        </span>

        <span className="weekly-flow-divider">✦</span>

        <span>
          <strong>{daysWithMoments}</strong>{" "}
          {daysWithMoments === 1 ? "day" : "days"} logged
        </span>
      </div>

    </section>
  );
}

export default WeeklyFlow;