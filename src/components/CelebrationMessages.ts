export const celebrationLines: Record<string, readonly string[]> = {
  General: [
    "chat we actually did something",
    "rare footage of me functioning",
    "the allegations are true",
    "bro actually locked in",
    "certified W",
    "wait this is kinda tuff",
    "the aura gains are real",
    "poggers behaviour",
    "we're so back",
    "the NPC gained free will",
    "those who know",
    "bro might actually be cooking",
    "this is NOT a drill",
    "the haters are in shambles",
    "another W for the collection",
    "the simulation is getting interesting"
  ],

  Avery: [
    "the unemployed roommate is thriving",
    "Avery stays mogging",
    "the creature has been serviced",
    "dog maintenance goes crazy",
    "the floof is looking tuff",
    "Avery's aura is generational",
    "the fur distribution system is thriving",
    "certified good girl activities",
    "the beast has been appeased",
    "bro is literally just a dog",
    "the yapper has been attended to",
    "Avery's PR team is glazing",
    "the canine allegations are adorable",
    "the creature remains undefeated",
    "another W for the unemployed",
    "the dog economy is booming"
  ],

  Movement: [
    "bro voluntarily moved",
    "the cardio allegations are true",
    "legs are NOT beating the employment allegations",
    "the pavement got mogged",
    "IRL movement speed increased",
    "the stamina stat is looking tuff",
    "bro is speedrunning cardiovascular health",
    "the physical activity is actually poggers",
    "the couch lost custody",
    "movementmaxxing goes crazy",
    "the step count is cooking",
    "the fitness NPC has spawned",
    "the grass has been touched",
    "the legs have entered ranked",
    "bro unlocked the walking animation",
    "the cardiovascular system is glazing"
  ],

  Home: [
    "the habitat is getting mogged",
    "the dust bunnies got absolutely cooked",
    "domestic LARPing goes crazy",
    "the clutter took a generational L",
    "bro is actually maintaining a residence",
    "the cleaning allegations are true",
    "the habitat is looking tuff",
    "the grime got ratioed",
    "the vacuum has entered its villain arc",
    "the domestic NPC is locked in",
    "the dust got sent to the backrooms",
    "the apartment aura just increased",
    "the dishes got humbled",
    "the bacteria are in shambles",
    "the cleaning meta is undefeated",
    "the household is NOT cooked"
  ],

  "Self-care": [
    "looksmaxxing allegations confirmed",
    "the face card stays undefeated",
    "the maintenance is maintenance-ing",
    "bro invested in the character build",
    "the self-care aura is immaculate",
    "the skin is getting glazed",
    "the glow-up is actually tuff",
    "the princess LARP continues",
    "the body got the premium treatment",
    "the self-maintenance DLC is installed",
    "bro is mogging the previous build",
    "the face economy is booming",
    "the skincare department is locked in",
    "the mirror is about to start glazing",
    "the baddie maintenance is operational",
    "the character customization goes crazy"
  ],

  Fun: [
    "the dopamine was absolutely cooking",
    "enrichment time goes crazy",
    "bro remembered how to have fun",
    "certified poggers moment",
    "the serotonin allegations are true",
    "the vibes are looking tuff",
    "the fun economy is booming",
    "the NPC discovered recreational activities",
    "the entertainment DLC was worth it",
    "the joymaxxing is generational",
    "the brain got its enrichment",
    "bro is actually enjoying the simulation",
    "the happiness stat got buffed",
    "the silliness has been deployed",
    "the recreational LARP was successful",
    "the dopamine receptors are glazing"
  ],

  "Life admin": [
    "the bureaucracy got mogged",
    "bro defeated the paperwork boss",
    "the administrative allegations are true",
    "the frontal lobe actually locked in",
    "the government NPC got humbled",
    "the paperwork took a generational L",
    "bro survived the civilian simulator",
    "the executive function is cooking",
    "the admin boss got absolutely folded",
    "the adulting LARP is getting serious",
    "the paperwork is NOT beating the allegations",
    "the braincells actually collaborated",
    "the bureaucracy skill issue is crazy",
    "the civilian duties have been mogged",
    "the responsible citizen cosplay goes crazy",
    "the admin department is so back"
  ]
};

const RECENT_KEY = "hgo-recent-celebration-lines";
const HISTORY_LIMIT = 200;

type CelebrationHistory = Record<string, string[]>;

/**
 * Read the saved rotation history.
 *
 * Supports the old string[] format and the new
 * category-based history format.
 */
function readHistory(): CelebrationHistory {
  try {
    const raw: unknown = JSON.parse(
      localStorage.getItem(RECENT_KEY) ?? "{}"
    );

    if (Array.isArray(raw)) {
      const history: CelebrationHistory = {};

      for (const entry of raw) {
        if (typeof entry !== "string") continue;

        // Old entries may contain "{action} — ".
        const cleaned = entry.replace(/^\{action\}\s*—\s*/, "");
        const separator = cleaned.indexOf(":");

        if (separator === -1) continue;

        const category = cleaned.slice(0, separator);
        const line = cleaned.slice(separator + 1);

        if (!category || !line) continue;

        (history[category] ??= []).push(line);
      }

      return history;
    }

    if (raw && typeof raw === "object") {
      const history: CelebrationHistory = {};

      for (const [category, entries] of Object.entries(raw)) {
        if (!Array.isArray(entries)) continue;

        history[category] = entries.filter(
          (entry): entry is string => typeof entry === "string"
        );
      }

      return history;
    }
  } catch {
    // Invalid or unavailable storage starts a fresh rotation.
  }

  return {};
}

/**
 * Return a random celebration message.
 *
 * - Each category rotates independently.
 * - Every message is used before the pool resets.
 * - Avoids immediate repeats when starting a new cycle.
 * - History persists across page refreshes.
 * - Returns only the message, never an action prefix.
 */
export function celebrationMessage(category = "General"): string {
  const group = Object.prototype.hasOwnProperty.call(
    celebrationLines,
    category
  )
    ? category
    : "General";

  const pool = celebrationLines[group];

  if (!pool?.length) return "certified W";

  const history = readHistory();
  const recent = history[group] ?? [];

  const unused = pool.filter(line => !recent.includes(line));

  // Reset the category once all messages have been played.
  // Keep the last message excluded to prevent back-to-back repeats.
  const previous = recent.at(-1);

  const choices = unused.length
    ? unused
    : pool.filter(line => line !== previous);

  const available = choices.length ? choices : pool;

  const chosen = available[
    Math.floor(Math.random() * available.length)
  ];

  // Begin a new cycle after exhausting the old one.
  const next = unused.length
    ? [...recent, chosen]
    : [chosen];

  history[group] = next.slice(-HISTORY_LIMIT);

  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(history));
  } catch {
    // Celebrations still work without persistent storage.
  }

  return chosen;
}