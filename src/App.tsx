import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import DailyStats from "./components/DailyStats";
import Calendar from "./components/Calendar";
import Moodboard from "./components/MoodBoard";
import Receipts from "./components/Receipts";
import DailyRituals from "./components/DailyRituals";
import LastDone from "./components/LastDone";
import Reminders from "./components/Reminders";
import Celebrations from "./components/Celebrations";

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const isToday =
    selectedDate.toDateString() === new Date().toDateString();

  function changeDay(amount: number) {
    setSelectedDate(previous => {
      const next = new Date(previous);
      next.setDate(next.getDate() + amount);
      return next;
    });
  }

  return (
    <div className="hgo-shell">

      {/* ========================================
          SIDEBAR
      ======================================== */}

      <aside className="hgo-empty-sidebar" aria-label="Sidebar">

        {/* Header */}

        <div className="hgo-sidebar-brand">

          {/* Branding */}
          <div className="hgo-brand-row">

            <div className="hgo-sidebar-flower">
              ✿
            </div>

            <div className="hgo-sidebar-brand-text">
              <h1>Hot Girl Organizer</h1>
              <p>the horrors persist but so do i ♡</p>
            </div>

          </div>

          {/* Date Navigator */}
          <div className="hgo-date-card">

            <div className="hgo-date-controls">

              <button
                type="button"
                onClick={() => changeDay(-1)}
                aria-label="Previous day"
              >
                <ChevronLeft size={17} />
              </button>

              <div className="hgo-date-display">

                <span className="hgo-date-weekday">
                  {selectedDate.toLocaleDateString("en-CA", {
                    weekday: "long"
                  })}
                </span>

                <span className="hgo-date-full">
                  {selectedDate.toLocaleDateString("en-CA", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })}
                </span>

              </div>

              <button
                type="button"
                onClick={() => changeDay(1)}
                aria-label="Next day"
              >
                <ChevronRight size={17} />
              </button>

            </div>

          </div>

          {/* Today indicator — outside date card */}
          <div className="hgo-date-status">
            {isToday && (
              <span>♡ Today</span>
            )}
          </div>

          <div className="hgo-sidebar-divider" />

        </div>


        {/* Vibe Check */}
        <Moodboard selectedDate={selectedDate} />

      </aside>

      {/* ========================================
          MAIN DASHBOARD
      ======================================== */}

      <div className="hgo-page">

        <main className="dashboard hgo-screen-grid hgo-new-layout">

          {/* ROW 1 — Daily Routine */}
          <DailyRituals selectedDate={selectedDate} />

          {/* ROW 1 — Activities */}
          <Receipts
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />

          {/* ROW 1 — Reminders */}
          <Reminders />

          {/* ROW 2 — Calendar */}
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />

          {/* ROW 2 — DAILY STATS */}
          <div className="hgo-future-space hgo-stats-panel">
            <DailyStats selectedDate={selectedDate} />
          </div>

          {/* ROW 2 — When Did I Last */}
          <LastDone onDateSelect={setSelectedDate} />

        </main>
      </div>

      {/* Celebrations */}
      <Celebrations onDateSelect={setSelectedDate} />

    </div>
  );
}

export default App;