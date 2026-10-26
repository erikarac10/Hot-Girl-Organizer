import { useState } from "react";

import DailyStats from "./components/DailyStats";
import Calendar from "./components/Calendar";
import WeeklyFlow from "./components/WeeklyFlow";
import Moodboard from "./components/MoodBoard";
import Receipts from "./components/Receipts";
import DailyRituals from "./components/DailyRituals";
import LastDone from "./components/LastDone";
import Reminders from "./components/Reminders";
import Celebrations from "./components/Celebrations";

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className="hgo-shell">
      <aside className="hgo-empty-sidebar" aria-label="Daily stats">
        <DailyStats selectedDate={selectedDate} />
      </aside>

      <div className="hgo-page">
        <header className="hgo-topbar">
          <div className="hgo-brand">
            <div className="hgo-brand-flower">✿</div>

            <div className="hgo-brand-text">
              <span className="hgo-brand-label">MY PERSONAL SPACE</span>
              <h1>Hot Girl Organizer</h1>
              <p>the horrors persist but so do i</p>
            </div>
          </div>

          <div className="hgo-header-actions">
            <div className="hgo-date-pill">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M16 3v4M8 3v4M3 10h18" />
              </svg>

              {new Date().toLocaleDateString("en-CA", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>

            <div className="hgo-header-avatar">HG</div>
          </div>
        </header>

        <main className="dashboard">
          <Moodboard selectedDate={selectedDate} />

          <div className="dailies-stickies">
            <DailyRituals selectedDate={selectedDate} />
            <Reminders />
          </div>

          <Receipts
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />

          <WeeklyFlow
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />

          <Calendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />

          <LastDone onDateSelect={setSelectedDate} />

          <Celebrations onDateSelect={setSelectedDate} />
        </main>
      </div>
    </div>
  );
}

export default App;