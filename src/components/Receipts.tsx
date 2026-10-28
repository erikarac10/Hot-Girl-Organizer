import { useEffect, useState } from "react";
import {
  ChevronLeft, ChevronRight, Plus, X,
  Search, Pencil, Trash2, Check, ArrowLeft
} from "lucide-react";

import "./Receipts.css";

type Activity = {
  id: string;
  name: string;
  emoji: string;
  category: string;
  defaultMinutes?: number;
  custom?: boolean;
};

type Moment = {
  id: string;
  date: string;
  text: string;
  emoji?: string;
  activityId?: string;
  category?: string;
  minutes?: number;
  note?: string;
};

type ReceiptsProps = {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
};

const starterActivities: Activity[] = [
  { id: "avery-pee", name: "Avery morning pee", emoji: "🐾", category: "Avery" },
  { id: "avery-evening", name: "Avery evening pee", emoji: "🌙", category: "Avery" },
  { id: "avery-walk", name: "Walked Avery", emoji: "🐶", category: "Avery", defaultMinutes: 30 },
  { id: "avery-play", name: "Played with Avery", emoji: "🦴", category: "Avery" },
  { id: "avery-brush", name: "Combed Avery", emoji: "🪮", category: "Avery" },
  { id: "avery-teeth", name: "Brushed Avery’s teeth", emoji: "🪥", category: "Avery" },
  { id: "avery-nails", name: "Trimmed Avery’s nails", emoji: "🐾", category: "Avery" },

  { id: "jog", name: "Went for a jog", emoji: "🏃", category: "Movement", defaultMinutes: 20 },
  { id: "workout", name: "Worked out", emoji: "💪", category: "Movement" },
  { id: "stretch", name: "Stretched", emoji: "🧘", category: "Movement" },
  { id: "walk", name: "Went for a walk", emoji: "🚶", category: "Movement" },

  { id: "dishes", name: "Washed the dishes", emoji: "🫧", category: "Home" },
  { id: "dishwasher", name: "Loaded the dishwasher", emoji: "🍽️", category: "Home" },
  { id: "put-dishes-away", name: "Put dishes away", emoji: "🍽️", category: "Home" },
  { id: "vacuum-home", name: "Vacuumed the apartment", emoji: "🧹", category: "Home" },
  { id: "vacuum-couch", name: "Vacuumed the couch", emoji: "🛋️", category: "Home" },
  { id: "dust", name: "Dusted", emoji: "✨", category: "Home" },
  { id: "made-bed", name: "Made the bed", emoji: "🛏️", category: "Home" },
  { id: "tidied", name: "Tidied up", emoji: "🧺", category: "Home" },
  { id: "organized", name: "Organized something", emoji: "🎀", category: "Home" },
  { id: "put-away", name: "Put things away", emoji: "🧺", category: "Home" },

  { id: "shower", name: "Took a shower", emoji: "🛁", category: "Self-care" },
  { id: "hair", name: "Washed my hair", emoji: "🫧", category: "Self-care" },
  { id: "skin", name: "Did skincare", emoji: "🧴", category: "Self-care" },
  { id: "rest", name: "Made time to rest", emoji: "☁️", category: "Self-care" },

  { id: "games", name: "Played video games", emoji: "🎮", category: "Fun" },
  { id: "something-fun", name: "Did something fun", emoji: "🌸", category: "Fun" },
  { id: "creative", name: "Made something", emoji: "🎨", category: "Fun" },
  { id: "read", name: "Read something", emoji: "📖", category: "Fun" },
  { id: "out", name: "Went out", emoji: "🍓", category: "Fun" },

  { id: "email", name: "Took care of an email", emoji: "💌", category: "Life admin" },
  { id: "errand", name: "Ran an errand", emoji: "🛍️", category: "Life admin" },
];

const categories = [
  "Avery", "Movement", "Home", "Self-care",
  "Fun", "Life admin", "Other"
];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function readSaved<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) as T : fallback;
  } catch {
    return fallback;
  }
}

function Receipts({ selectedDate, onDateSelect }: ReceiptsProps) {

  const [moments, setMoments] = useState<Moment[]>(() =>
    readSaved("hot-girl-moments", [])
  );

  const [activities, setActivities] = useState<Activity[]>(() =>
    readSaved("hot-girl-activities", starterActivities)
  );

  const [screen, setScreen] = useState<"pick" | "log" | "activity" | null>(null);

  const [search, setSearch] = useState("");
  const [chosen, setChosen] = useState<Activity | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [logDate, setLogDate] = useState("");
  const [minutes, setMinutes] = useState("");
  const [note, setNote] = useState("");

  const [activityEditId, setActivityEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🌸");
  const [category, setCategory] = useState("Self-care");
  const [usualMinutes, setUsualMinutes] = useState("");

  // Save moments and activity library automatically

    useEffect(() => {
    localStorage.setItem("hot-girl-moments", JSON.stringify(moments));

    window.dispatchEvent(new Event("hgo-history-updated"));
    }, [moments]);

useEffect(() => {
  localStorage.setItem("hot-girl-activities", JSON.stringify(activities));

  window.dispatchEvent(new Event("hgo-history-updated"));
}, [activities]);

  const selectedKey = dateKey(selectedDate);
  const isToday = selectedKey === dateKey(new Date());

  const dayMoments = moments.filter(
    moment => moment.date === selectedKey
  );

  const filteredActivities = activities.filter(
    activity => activity.name.toLowerCase().includes(search.toLowerCase())
  );

  function changeDay(amount: number) {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + amount);
    onDateSelect(date);
  }

  // Open the activity picker

  function openPicker() {
    setEditingId(null);
    setChosen(null);
    setLogDate(selectedKey);
    setMinutes("");
    setNote("");
    setSearch("");
    setScreen("pick");
  }

  // Choose an existing activity

  function chooseActivity(activity: Activity) {
    setChosen(activity);
    setMinutes(activity.defaultMinutes?.toString() ?? "");
    setScreen("log");
  }

  // Edit an already logged moment

  function editMoment(moment: Moment) {
    const matching = activities.find(
      activity => activity.id === moment.activityId
    );

    setChosen(matching ?? {
      id: moment.activityId ?? moment.id,
      name: moment.text,
      emoji: moment.emoji ?? "♡",
      category: "Other"
    });

    setEditingId(moment.id);
    setLogDate(moment.date);
    setMinutes(moment.minutes?.toString() ?? "");
    setNote(moment.note ?? "");
    setScreen("log");
  }

  // Save the moment

  function saveMoment() {
    if (!chosen || !logDate) return;

    const duration = minutes.trim() ? Number(minutes) : undefined;

    if (duration !== undefined &&
        (!Number.isFinite(duration) || duration < 0)) return;

    const moment: Moment = {
      id: editingId ?? crypto.randomUUID(),
      date: logDate,
      text: chosen.name,
      emoji: chosen.emoji,
      activityId: chosen.id,
      category: chosen.category,
      minutes: duration && duration > 0 ? duration : undefined,
      note: note.trim()
    };

    setMoments(previous =>
      editingId
        ? previous.map(item => item.id === editingId ? moment : item)
        : [...previous, moment]
    );

    window.dispatchEvent(
        new CustomEvent("hgo-moment-saved", {
            detail: {
            moment,
            before: moments
            }
        })
    );

    onDateSelect(new Date(`${logDate}T12:00:00`));
    setScreen(null);
  }

  function removeMoment(id: string) {
    if (window.confirm("Remove this moment from your history?")) {
      setMoments(previous =>
        previous.filter(moment => moment.id !== id)
      );
    }
  }

  // Create or edit a saved activity

  function openActivityEditor(activity?: Activity) {
    setActivityEditId(activity?.id ?? null);
    setName(activity?.name ?? "");
    setEmoji(activity?.emoji ?? "🌸");
    setCategory(activity?.category ?? "Self-care");
    setUsualMinutes(activity?.defaultMinutes?.toString() ?? "");
    setScreen("activity");
  }

  function saveActivity() {
    if (!name.trim()) return;

    const duration = usualMinutes.trim()
      ? Number(usualMinutes)
      : undefined;

    if (duration !== undefined &&
        (!Number.isFinite(duration) || duration < 0)) return;

    const activity: Activity = {
      id: activityEditId ?? crypto.randomUUID(),
      name: name.trim(),
      emoji: emoji.trim() || "🌸",
      category,
      custom: true,
      defaultMinutes: duration && duration > 0 ? duration : undefined
    };

    setActivities(previous =>
      activityEditId
        ? previous.map(item =>
            item.id === activityEditId ? activity : item
          )
        : [...previous, activity]
    );

    if (activityEditId) {
      setScreen("pick");
    } else {
      chooseActivity(activity);
    }
  }

  function removeActivity(id: string) {
    if (window.confirm("Remove this saved activity? Your old receipts will stay.")) {
      setActivities(previous =>
        previous.filter(activity => activity.id !== id)
      );
    }
  }

  return (
    <section className="receipts">

      <div className="receipts-header">
        <div>
          <p className="receipts-eyebrow">
            life lore just dropped
          </p>

          <h2>
            Aura Farming Activities
            <span className="receipts-flower"> ✿</span>
          </h2>
        </div>

        <button className="receipts-add" onClick={openPicker}>
          <Plus size={16} />
          Add Aura Gain
        </button>
      </div>

      <div className="receipts-navigation">
        <button onClick={() => changeDay(-1)} aria-label="Previous day">
          <ChevronLeft size={17} />
        </button>

        <span>
          {isToday
            ? "Today"
            : selectedDate.toLocaleDateString("en-CA", {
                month: "short",
                day: "numeric"
              })}
        </span>

        <button onClick={() => changeDay(1)} aria-label="Next day">
          <ChevronRight size={17} />
        </button>

        {!isToday && (
          <button
            className="receipts-today"
            onClick={() => onDateSelect(new Date())}
          >
            Today
          </button>
        )}
      </div>

      {/* Today's logged activities */}

      {dayMoments.length === 0 ? (
        <div className="receipts-empty">
          <div className="receipts-heart">♡</div>

          <strong>zero rizz detected</strong>

          <p>
            prey mentality
          </p>
        </div>
      ) : (
        <div className="receipts-list">
          {dayMoments.map(moment => (
            <div className="receipts-entry" key={moment.id}>

              <div className="hgo-entry-content">
                <span className="hgo-entry-emoji">
                  {moment.emoji ?? "♡"}
                </span>

                <div>
                  <strong>{moment.text}</strong>

                  {moment.minutes !== undefined && (
                    <small>{moment.minutes} minutes</small>
                  )}

                  {moment.note && <p>{moment.note}</p>}
                </div>
              </div>

              <div className="hgo-entry-actions">
                <button
                  onClick={() => editMoment(moment)}
                  aria-label="Edit moment"
                >
                  <Pencil size={15} />
                </button>

                <button
                  onClick={() => removeMoment(moment.id)}
                  aria-label="Delete moment"
                >
                  <X size={17} />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Popup */}

      {screen && (
        <div
          className="hgo-overlay"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              setScreen(null);
            }
          }}
        >
          <div
            className="hgo-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Log a little moment"
          >

            <div className="hgo-modal-heading">
              <div>

                <h2>
                  {screen === "activity"
                    ? activityEditId
                      ? "Edit saved activity"
                      : "New Activity Just Dropped"
                    : editingId
                      ? "Edit Aura"
                      : "Add Aura Gain"}
                  <span> ✿</span>
                </h2>
              </div>

              <button
                className="hgo-icon-button"
                onClick={() => setScreen(null)}
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>

            {/* SCREEN 1: Choose an activity */}

            {screen === "pick" && (
              <>
                <div className="hgo-search">
                  <Search size={17} />

                  <input
                    autoFocus
                    placeholder="what were we farming?"
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                  />
                </div>

                <div className="hgo-activity-list">
                  {filteredActivities.map(activity => (
                    <div className="hgo-activity-option" key={activity.id}>

                      <button
                        className="hgo-select-activity"
                        onClick={() => chooseActivity(activity)}
                      >
                        <span className="hgo-activity-emoji">
                          {activity.emoji}
                        </span>

                        <span>{activity.name}</span>

                        <Plus size={16} />
                      </button>

                      {activity.custom && (
                        <div className="hgo-custom-actions">
                          <button
                            onClick={() => openActivityEditor(activity)}
                            aria-label={`Edit ${activity.name}`}
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            onClick={() => removeActivity(activity.id)}
                            aria-label={`Delete ${activity.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}

                    </div>
                  ))}

                  {filteredActivities.length === 0 && (
                    <p className="hgo-no-results">
                      No matching activities. Make your own below!
                    </p>
                  )}
                </div>

                <button
                  className="hgo-create-link"
                  onClick={() => openActivityEditor()}
                >
                  + New Aura Farming Method
                </button>
              </>
            )}

            {/* SCREEN 2: Add notes and duration */}

            {screen === "log" && chosen && (
              <>
                <div className="hgo-chosen">
                  <span>{chosen.emoji}</span>
                  <strong>{chosen.name}</strong>

                  <button onClick={() => setScreen("pick")}>
                    Change
                  </button>
                </div>

                <div className="hgo-fields">
                  <label>
                    Date
                    <input
                      type="date"
                      value={logDate}
                      onChange={event => setLogDate(event.target.value)}
                    />
                  </label>

                  <label>
                    Minutes <small>(optional)</small>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="e.g. 30"
                      value={minutes}
                      onChange={event => setMinutes(event.target.value)}
                    />
                  </label>
                </div>

                <label className="hgo-label">
                  Note <small>(optional)</small>

                  <textarea
                    rows={4}
                    placeholder="Closing TED Talk"
                    value={note}
                    onChange={event => setNote(event.target.value)}
                  />
                </label>

                <div className="hgo-modal-actions">
                  <button onClick={() => setScreen(null)}>
                    Cancel
                  </button>

                  <button className="hgo-primary" onClick={saveMoment}>
                    <Check size={16} />
                    {editingId ? "Save" : "Save"}
                  </button>
                </div>
              </>
            )}

            {/* SCREEN 3: Create a custom activity */}

            {screen === "activity" && (
              <>
                <label className="hgo-label">
                  Activity name

                  <input
                    autoFocus
                    placeholder="e.g. 69-step skincare routine"
                    value={name}
                    onChange={event => setName(event.target.value)}
                  />
                </label>

                <div className="hgo-fields">
                  <label>
                    Emoji

                    <input
                      value={emoji}
                      onChange={event => setEmoji(event.target.value)}
                      maxLength={8}
                    />
                  </label>

                  <label>
                    Category

                    <select
                      value={category}
                      onChange={event => setCategory(event.target.value)}
                    >
                      {categories.map(item => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="hgo-label">
                  Usual minutes <small>(optional)</small>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={usualMinutes}
                    onChange={event => setUsualMinutes(event.target.value)}
                    placeholder="e.g. 20"
                  />
                </label>

                <div className="hgo-modal-actions">
                  <button onClick={() => setScreen("pick")}>
                    <ArrowLeft size={15} />
                    Back
                  </button>

                  <button
                    className="hgo-primary"
                    onClick={saveActivity}
                    disabled={!name.trim()}
                  >
                    <Check size={16} />
                    Save activity
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </section>
  );
}

export default Receipts;