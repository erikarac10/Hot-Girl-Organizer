import { useEffect, useState } from "react";
import {
  Heart,
  Clock3,
  PawPrint,
  Sparkles,
  House,
  Star,
  CheckCheck,
  Smile
} from "lucide-react";

import "./DailyStats.css";

type Moment = {
  date: string;
  text: string;
  activityId?: string;
  category?: string;
  minutes?: number;
};

type Activity = {
  id: string;
  name: string;
  category: string;
};

type Reminder = {
  done: boolean;
  completedOn?: string;
};

type MoodEntry = {
  mood?: string;
  energy?: string;
  note?: string;
};

type MoodHistory = Record<string, MoodEntry>;

function loadMoods(): MoodHistory {
  try {
    return JSON.parse(
      localStorage.getItem("hot-girl-moodboard") || "{}"
    );
  } catch {
    return {};
  }
}

type DailyStatsProps = {
  selectedDate: Date;
};

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function loadSaved<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function DailyStats({ selectedDate }: DailyStatsProps) {
  const [moments, setMoments] = useState<Moment[]>(
    () => loadSaved("hot-girl-moments")
  );

  const [activities, setActivities] = useState<Activity[]>(
    () => loadSaved("hot-girl-activities")
  );

  const [reminders, setReminders] = useState<Reminder[]>(
    () => loadSaved("hot-girl-reminders")
  );

  const [moods, setMoods] = useState<MoodHistory>(loadMoods);

    // Refresh whenever a moment, reminder, or mood changes
        useEffect(() => {
        function refresh() {
            setMoments(loadSaved("hot-girl-moments"));
            setActivities(loadSaved("hot-girl-activities"));
            setReminders(loadSaved("hot-girl-reminders"));
            setMoods(loadMoods());
        }

        window.addEventListener("hgo-history-updated", refresh);
        window.addEventListener("hgo-reminders-updated", refresh);
        window.addEventListener("hgo-mood-updated", refresh);
        window.addEventListener("storage", refresh);

        return () => {
            window.removeEventListener("hgo-history-updated", refresh);
            window.removeEventListener("hgo-reminders-updated", refresh);
            window.removeEventListener("hgo-mood-updated", refresh);
            window.removeEventListener("storage", refresh);
        };
    }, []);

  const selectedKey = dateKey(selectedDate);
  const dayMood = moods[selectedKey];

    const moodLabel = dayMood?.mood
    ? dayMood.mood.charAt(0).toUpperCase() + dayMood.mood.slice(1)
    : "—";

    const energyLabel = dayMood?.energy
    ? `${dayMood.energy.charAt(0).toUpperCase()}${dayMood.energy.slice(1)} energy`
    : "No energy recorded";

  // Everything logged on the selected date
  const dayMoments = moments.filter(
    moment => moment.date === selectedKey
  );

  // Find the category of a logged activity
  function getCategory(moment: Moment) {
    if (moment.category) return moment.category;

    const activity = activities.find(
      item =>
        item.id === moment.activityId ||
        item.name.toLowerCase() === moment.text.toLowerCase()
    );

    return activity?.category ?? "Other";
  }

  // Count moments belonging to a category
  function countCategory(category: string) {
    return dayMoments.filter(
      moment => getCategory(moment) === category
    ).length;
  }

  // Only count time spent physically active
  const activeMinutes = dayMoments.reduce((total, moment) => {
    const category = getCategory(moment);

    const isActive =
      category === "Movement" ||
      (
        category === "Avery" &&
        moment.text.toLowerCase().includes("walk")
      );

    return isActive
      ? total + (Number(moment.minutes) || 0)
      : total;
  }, 0);

  function formatTime(minutes: number) {
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;

    return remaining
      ? `${hours}h ${remaining}m`
      : `${hours}h`;
  }

  // Only count completed to-do reminders, not daily rituals
  const completedTodos = reminders.filter(
    reminder =>
      reminder.done &&
      reminder.completedOn === selectedKey
  ).length;

  const stats = [
    {
      title: "LITTLE MOMENTS",
      value: dayMoments.length,
      subtitle: "Things you logged",
      icon: <Heart size={20} />,
      color: "rose"
    },
    {
      title: "TIME WELL SPENT",
      value: formatTime(activeMinutes),
      subtitle: "Time spent moving",
      icon: <Clock3 size={20} />,
      color: "peach"
    },
    {
      title: "AVERY LOVE",
      value: countCategory("Avery"),
      subtitle: "Little moments with Avery",
      icon: <PawPrint size={20} />,
      color: "mint"
    },
    {
      title: "HOT GIRL MAINTENANCE",
      value: countCategory("Self-care"),
      subtitle: "Ways you cared for yourself",
      icon: <Sparkles size={20} />,
      color: "blue"
    },
    {
      title: "DOMESTIC GODDESS",
      value: countCategory("Home"),
      subtitle: "Home-care moments",
      icon: <House size={20} />,
      color: "lavender"
    },
    {
      title: "MAIN CHARACTER MOMENTS",
      value: countCategory("Fun"),
      subtitle: "Fun things you did",
      icon: <Star size={20} />,
      color: "pink"
    }
  ];

  return (
    <section className="daily-stats">

      {/* Sidebar branding */}
      <div className="sidebar-brand">
        <span className="brand-flower">✿</span>

        <h1>Hot Girl Organizer</h1>

        <p>the horrors persist but so do i ♡</p>

        <span className="sidebar-date">
          {new Date().toLocaleDateString("en-CA", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>

      {/* Daily statistics */}
      {/* Daily statistics */}
      {stats.map(stat => (
        <div
          className={`stat-card ${stat.color}`}
          key={stat.subtitle}
        >
          <div className="stat-icon">
            {stat.icon}
          </div>

          <strong className="stat-number">
            {stat.value}
          </strong>

          <p className="stat-subtitle">
            {stat.subtitle}
          </p>
        </div>
      ))}

    </section>
  );
}

export default DailyStats;