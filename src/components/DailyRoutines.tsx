import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Heart } from "lucide-react";
import "./DailyRoutines.css";

type Routine = {
  id: string;
  title: string;
  emoji: string;
  completed: string[];
  addedOn?: string;
  removedOn?: string;
};

type DailyRoutinesProps = { selectedDate: Date };
type RoutineChanges = Partial<Pick<Routine, "title" | "emoji">>;

const STORAGE_KEY = "hot-girl-habits";
const LEGACY_IDS = new Set(["water", "movement", "reading", "break"]);
const STARTER_ROUTINES = [
  { id: "vyvanse", title: "Vyvanse", emoji: "💊" },
  { id: "vacuum", title: "Vacuum", emoji: "🧹" },
  { id: "vacuum-couch", title: "Vacuum couch", emoji: "🛋️" },
  { id: "dust", title: "Dust", emoji: "🪶" },
  { id: "shower", title: "Shower", emoji: "🚿" },
  { id: "get-ready", title: "Get Ready", emoji: "👗" },
  { id: "avery-walk", title: "Avery Morning Walk", emoji: "🐕" }
] as const;

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function activeOn(routine: Routine, date: string): boolean {
  return (!routine.addedOn || routine.addedOn <= date) &&
    (!routine.removedOn || date < routine.removedOn);
}

function defaults(startDate: string): Routine[] {
  return STARTER_ROUTINES.map(routine => ({
    ...routine,
    completed: [],
    addedOn: startDate
  }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Keep existing check-in history, even when old saved data is incomplete. */
function parseRoutines(value: unknown): Routine[] | null {
  if (!Array.isArray(value)) return null;

  const seenIds = new Set<string>();
  const routines: Routine[] = [];

  for (const item of value) {
    if (!isRecord(item) || typeof item.id !== "string" ||
        typeof item.title !== "string") continue;

    const id = item.id.trim();
    if (!id) continue;

    const uniqueId = seenIds.has(id) ? crypto.randomUUID() : id;
    seenIds.add(uniqueId);

    routines.push({
      id: uniqueId,
      title: item.title,
      emoji: typeof item.emoji === "string" ? item.emoji : "✿",
      completed: Array.isArray(item.completed)
        ? [...new Set(item.completed.filter((day): day is string => typeof day === "string"))]
        : [],
      ...(typeof item.addedOn === "string" ? { addedOn: item.addedOn } : {}),
      ...(typeof item.removedOn === "string" ? { removedOn: item.removedOn } : {})
    });
  }

  return routines;
}

function loadRoutines(): Routine[] {
  const today = dateKey(new Date());

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return defaults(today);

    const routines = parseRoutines(JSON.parse(saved) as unknown);
    if (!routines) return defaults(today);

    // Old installs used water/movement/reading/break. Archive, don't delete,
    // their historical check-ins when installing the current starter routines.
    if (routines.some(routine => routine.id === "avery-walk")) return routines;

    return [
      ...routines.map(routine =>
        LEGACY_IDS.has(routine.id) && !routine.removedOn
          ? { ...routine, removedOn: today }
          : routine
      ),
      ...defaults(today)
    ];
  } catch {
    return defaults(today);
  }
}

export default function DailyRoutines({ selectedDate }: DailyRoutinesProps) {
  const [routines, setRoutines] = useState<Routine[]>(loadRoutines);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<Routine[]>([]);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const editButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const selectedKey = dateKey(selectedDate);
  const todayKey = dateKey(new Date());

  const visibleRoutines = routines.filter(routine => activeOn(routine, selectedKey));
  const editableRoutines = draft.filter(routine => activeOn(routine, todayKey));
  const hasEmptyTitle = editableRoutines.some(routine => !routine.title.trim());

  function commitRoutines(next: Routine[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // In-memory edits still work if storage is unavailable.
    }
    setRoutines(next);
  }

  useEffect(() => {
    const refresh = () => {
      setRoutines(loadRoutines());
      setEditorOpen(false); // Don't save an outdated draft over another tab.
      setPendingDelete(null);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) refresh();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("hgo-data-restored", refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("hgo-data-restored", refresh);
    };
  }, []);

  useEffect(() => {
    if (!editorOpen) return;

    const dialog = dialogRef.current;
    dialog?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setEditorOpen(false);
        setPendingDelete(null);
        return;
      }

      if (event.key !== "Tab" || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]'
      )).filter(element => element.getClientRects().length > 0);

      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      editButtonRef.current?.focus();
    };
  }, [editorOpen]);

  function toggleRoutine(routine: Routine) {
    const previous = loadRoutines();
    const latest = previous.find(item => item.id === routine.id);
    if (!latest) return;
    const checked = latest.completed.includes(selectedKey);
    const completed = checked
      ? latest.completed.filter(day => day !== selectedKey)
      : [...latest.completed, selectedKey];

    commitRoutines(previous.map(item =>
      item.id === routine.id ? { ...item, completed } : item
    ));

    if (!checked) {
      window.dispatchEvent(new CustomEvent("hgo-routine-checked", {
        detail: { title: latest.title, date: selectedKey, completed }
      }));
    }
  }

  function openEditor() {
    setDraft(routines.map(routine => ({ ...routine, completed: [...routine.completed] })));
    setPendingDelete(null);
    setEditorOpen(true);
  }

  function closeEditor() {
    setPendingDelete(null);
    setEditorOpen(false);
  }

  function editRoutine(id: string, changes: RoutineChanges) {
    setDraft(previous => previous.map(routine =>
      routine.id === id ? { ...routine, ...changes } : routine
    ));
  }

  function addRoutine() {
    setDraft(previous => [...previous, {
      id: crypto.randomUUID(),
      title: "",
      emoji: "✿",
      completed: [],
      addedOn: todayKey
    }]);
    setPendingDelete(null);
  }

  function removeRoutine(id: string) {
    const isSaved = routines.some(routine => routine.id === id);
    setDraft(previous => isSaved
      ? previous.map(routine => routine.id === id
          ? { ...routine, removedOn: todayKey }
          : routine)
      : previous.filter(routine => routine.id !== id)
    );
    setPendingDelete(null);
  }

  function saveEditor() {
    if (hasEmptyTitle) return;
    commitRoutines(draft.map(routine => ({
      ...routine,
      title: routine.title.trim(),
      emoji: routine.emoji.trim() || "✿"
    })));
    closeEditor();
  }

  return (
    <section className="daily-routines" aria-labelledby="daily-routines-title">
      <div className="routines-header">
        <div>
          <p className="dailyroutines-eyebrow">mewing maintenance</p>
          <h2 id="daily-routines-title">Daily RoutineMaxxing <span>♡</span></h2>
        </div>
        <div className="routines-header-icon" aria-hidden="true">
          <Heart size={19} />
        </div>
      </div>

      <div className="routines-list">
        {visibleRoutines.map(routine => {
          const checked = routine.completed.includes(selectedKey);
          return (
            <div className="routine-row" key={routine.id}>
              <span className="routine-emoji" aria-hidden="true">{routine.emoji}</span>
              <span className="routine-title">{routine.title}</span>
              <button
                type="button"
                className={`routine-check${checked ? " checked" : ""}`}
                onClick={() => toggleRoutine(routine)}
                aria-label={`${checked ? "Uncheck" : "Check"} ${routine.title}`}
                aria-pressed={checked}
              >
                {checked && <Check size={16} aria-hidden="true" />}
              </button>
            </div>
          );
        })}
      </div>

      <button
        ref={editButtonRef}
        type="button"
        className="routines-add"
        onClick={openEditor}
      >
        ✎ Glaze my routine
      </button>

      {editorOpen && createPortal(
        <div
          className="routine-modal-backdrop"
          onMouseDown={event => {
            if (event.target === event.currentTarget) closeEditor();
          }}
        >
          <div
            ref={dialogRef}
            className="routine-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="routine-modal-title"
            tabIndex={-1}
          >
            <div className="routine-modal-header">
              <div>
                <h2 id="routine-modal-title">Glaze My Routine ♡</h2>
                <p>girlhood is a full-time LARP</p>
              </div>
            </div>

            <div className="routine-modal-list">
              {editableRoutines.map(routine => (
                <div className="routine-modal-row" key={routine.id}>
                  <input
                    className="routine-modal-emoji"
                    value={routine.emoji}
                    maxLength={8}
                    aria-label={`Icon for ${routine.title || "new routine"}`}
                    onChange={event => editRoutine(routine.id, { emoji: event.target.value })}
                  />
                  <input
                    className="routine-modal-name"
                    value={routine.title}
                    placeholder="Name your routine..."
                    aria-label="Routine name"
                    onChange={event => editRoutine(routine.id, { title: event.target.value })}
                  />

                  {pendingDelete === routine.id ? (
                    <div className="routine-delete-confirm">
                      <button
                        type="button"
                        className="routine-yeet"
                        onClick={() => removeRoutine(routine.id)}
                        aria-label={`Confirm removal of ${routine.title || "new routine"}`}
                      >
                        Yeet
                      </button>
                      <button
                        type="button"
                        className="routine-yeet-cancel"
                        onClick={() => setPendingDelete(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="routine-modal-delete"
                      onClick={() => setPendingDelete(routine.id)}
                      aria-label={`Remove ${routine.title || "new routine"}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button type="button" className="routine-modal-add" onClick={addRoutine}>
              + Add Tomfoolery
            </button>

            <div className="routine-modal-footer">
              <button type="button" className="routine-modal-cancel" onClick={closeEditor}>
                Nvm Gang
              </button>
              <button
                type="button"
                className="routine-modal-save"
                onClick={saveEditor}
                disabled={hasEmptyTitle}
              >
                We Ball ♡
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
