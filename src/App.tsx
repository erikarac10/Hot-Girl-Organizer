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

        <main className="dashboard hgo-screen-grid">
          <div className="hgo-screen-row hgo-row-top">
            <DailyRituals selectedDate={selectedDate} />
            <Reminders />
          </div>

          <div className="hgo-screen-row hgo-row-middle">
            <Moodboard selectedDate={selectedDate} />
            <Receipts
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </div>

          <div className="hgo-screen-row hgo-row-bottom">
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />

            <div className="hgo-side-stack">
              <WeeklyFlow
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
              <LastDone onDateSelect={setSelectedDate} />
            </div>
          </div>
        </main>
      </div>

      <Celebrations onDateSelect={setSelectedDate} />
    </div>
  );
}

export default App;
