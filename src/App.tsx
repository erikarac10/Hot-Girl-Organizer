import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import DailyStats from "./components/DailyStats";
import Calendar from "./components/Calendar";
import Moodboard from "./components/MoodBoard";
import Activities from "./components/Activities";
import DailyRoutines from "./components/DailyRoutines";
import LastDone from "./components/LastDone";
import Reminders from "./components/Reminders";
import Celebrations from "./components/Celebrations";
//import DataBackup from "./backup/DataBackup";

export default function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const isToday = selectedDate.toDateString() === new Date().toDateString();

  function changeDay(amount: number) {
    setSelectedDate(previous => {
      const next = new Date(previous);
      next.setDate(next.getDate() + amount);
      return next;
    });
  }

  return (
    <div className="hgo-shell">
      <aside className="hgo-empty-sidebar" aria-label="Sidebar">
        <div className="hgo-sidebar-brand">
          <div className="hgo-brand-row">
            <div className="hgo-sidebar-flower">✿</div>
            <div className="hgo-sidebar-brand-text">
              <h1>Hot Girl Organizer</h1>
              <p>the horrors persist but so do i ♡</p>
            </div>
          </div>
          <div className="hgo-date-card">
            <div className="hgo-date-controls">
              <button type="button" onClick={() => changeDay(-1)} aria-label="Previous day">
                <ChevronLeft size={17} />
              </button>
              <div className="hgo-date-display">
                <span className="hgo-date-weekday">
                  {selectedDate.toLocaleDateString("en-CA", { weekday: "long" })}
                </span>
                <span className="hgo-date-full">
                  {selectedDate.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <button type="button" onClick={() => changeDay(1)} aria-label="Next day">
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
          <div className="hgo-date-status">{isToday && <span>♡ Today</span>}</div>
          <div className="hgo-sidebar-divider" />
        </div>
        <Moodboard selectedDate={selectedDate} />
        {/*<DataBackup />*/}
      </aside>

      <div className="hgo-page">
        <main className="dashboard hgo-screen-grid hgo-new-layout">
          <DailyRoutines selectedDate={selectedDate} />
          <Activities selectedDate={selectedDate} onDateSelect={setSelectedDate} />
          <Reminders />
          <Calendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
          <div className="hgo-future-space hgo-stats-panel">
            <DailyStats selectedDate={selectedDate} />
          </div>
          <LastDone onDateSelect={setSelectedDate} />
        </main>
      </div>
      <Celebrations onDateSelect={setSelectedDate} />
    </div>
  );
}
