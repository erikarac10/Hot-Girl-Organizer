/** A portable, versioned backup of the organizer's browser-only history. */
export const BACKUP_FORMAT = "hot-girl-organizer";
export const BACKUP_VERSION = 1;

const CATEGORIES = {
  "hot-girl-moments": "array",
  "hot-girl-activities": "array",
  "hot-girl-habits": "array", // Keep this legacy key: it holds DailyRoutines history.
  "hot-girl-reminders": "array",
  "hot-girl-moodboard": "object",
  "hgo-celebrations-seen": "array",
  "hgo-recent-celebration-lines": "array"
} as const;

type CategoryKey = keyof typeof CATEGORIES;
type StorageAccess = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type OrganizerBackup = {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  data: Partial<Record<CategoryKey, unknown>>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertCategory(key: CategoryKey, data: unknown): void {
  if (CATEGORIES[key] === "array" ? !Array.isArray(data) : !isRecord(data)) {
    throw new Error(`Invalid backup data for ${key}.`);
  }
}

export function createBackup(storage: StorageAccess): OrganizerBackup {
  const data: OrganizerBackup["data"] = {};
  for (const key of Object.keys(CATEGORIES) as CategoryKey[]) {
    const raw = storage.getItem(key);
    if (raw === null) continue;
    let value: unknown;
    try {
      value = JSON.parse(raw) as unknown;
    } catch {
      throw new Error(`Unable to export ${key}: saved data is not valid JSON.`);
    }
    assertCategory(key, value);
    data[key] = value;
  }
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data
  };
}

export function validateBackup(value: unknown): OrganizerBackup {
  if (!isRecord(value) || value.format !== BACKUP_FORMAT ||
      value.version !== BACKUP_VERSION || !isRecord(value.data)) {
    throw new Error("This is not a supported Hot Girl Organizer backup.");
  }
  const data = value.data;
  const keys = Object.keys(data);
  if (!keys.length || keys.some(key => !(key in CATEGORIES))) {
    throw new Error("This backup has no recognized data or contains unknown categories.");
  }
  for (const key of keys as CategoryKey[]) assertCategory(key, data[key]);
  if (typeof value.exportedAt !== "string") {
    throw new Error("The backup is missing its export date.");
  }
  return value as OrganizerBackup;
}

/** Validate everything before writing; roll back all keys if any write fails. */
export function restoreBackup(storage: StorageAccess, input: unknown): number {
  const backup = validateBackup(input);
  const keys = Object.keys(backup.data) as CategoryKey[];
  const original = new Map(keys.map(key => [key, storage.getItem(key)]));
  const updated: CategoryKey[] = [];
  try {
    for (const key of keys) {
      storage.setItem(key, JSON.stringify(backup.data[key]));
      updated.push(key);
    }
  } catch {
    for (const key of updated) {
      const previous = original.get(key);
      try {
        if (previous === null || previous === undefined) storage.removeItem(key);
        else storage.setItem(key, previous);
      } catch { /* Storage may be unavailable; report failure below. */ }
    }
    throw new Error("The backup couldn't be restored. Your previous data was retained where possible.");
  }
  return keys.length;
}
