import { useRef, useState, type ChangeEvent } from "react";
import { Download, Upload } from "lucide-react";
import { createBackup, restoreBackup, validateBackup } from "./backupData";
import "./DataBackup.css";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong with the backup.";
}

export default function DataBackup() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");

  function exportData() {
    try {
      const backup = createBackup(localStorage);
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `hot-girl-organizer-${new Date().toLocaleDateString("en-CA").replaceAll("/", "-")}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus("Your lore is backed up.");
    } catch (error) {
      setStatus(errorMessage(error));
    }
  }

  async function importData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const parsed: unknown = JSON.parse(await file.text());
      // Validate before the confirmation and before touching existing records.
      const backup = validateBackup(parsed);
      const count = Object.keys(backup.data).length;
      if (!window.confirm(`Restore ${count} data categories from this backup? Matching saved data will be replaced.`)) return;
      restoreBackup(localStorage, backup);

      // React components in this tab don't receive native storage events.
      window.dispatchEvent(new Event("hgo-data-restored"));
      window.dispatchEvent(new Event("hgo-history-updated"));
      window.dispatchEvent(new Event("hgo-reminders-updated"));
      window.dispatchEvent(new Event("hgo-mood-updated"));
      setStatus("Your lore has been restored.");
    } catch (error) {
      setStatus(errorMessage(error));
    }
  }

  return (
    <section className="hgo-backup" aria-label="Backup and restore your data">
      <p className="hgo-backup-title">keep the receipts ♡</p>
      <div className="hgo-backup-actions">
        <button type="button" onClick={exportData}>
          <Download size={14} aria-hidden="true" /> Export data
        </button>
        <button type="button" onClick={() => inputRef.current?.click()}>
          <Upload size={14} aria-hidden="true" /> Import data
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        className="hgo-backup-file"
        aria-label="Choose organizer backup JSON"
        onChange={importData}
      />
      {status && <p className="hgo-backup-status" role="status">{status}</p>}
    </section>
  );
}
