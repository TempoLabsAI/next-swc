import { openDB, DBSchema, IDBPDatabase } from "idb";
import { TutorialState, TutorialProgress, ExtensionSettings } from "../types";

interface TutorialDB extends DBSchema {
  tutorialStates: {
    key: string;
    value: TutorialState;
  };
  progress: {
    key: string;
    value: TutorialProgress;
  };
  settings: {
    key: string;
    value: ExtensionSettings;
  };
}

export class StorageService {
  private db: IDBPDatabase<TutorialDB> | null = null;
  private dbName = "ai-tutor-db";
  private dbVersion = 1;

  async init(): Promise<void> {
    try {
      this.db = await openDB<TutorialDB>(this.dbName, this.dbVersion, {
        upgrade(db) {
          // Create object stores
          if (!db.objectStoreNames.contains("tutorialStates")) {
            db.createObjectStore("tutorialStates");
          }
          if (!db.objectStoreNames.contains("progress")) {
            db.createObjectStore("progress");
          }
          if (!db.objectStoreNames.contains("settings")) {
            db.createObjectStore("settings");
          }
        },
      });
    } catch (error) {
      console.warn(
        "IndexedDB not available, falling back to localStorage:",
        error,
      );
    }
  }

  async getTutorialState(siteId: string): Promise<TutorialState | null> {
    try {
      if (this.db) {
        return (await this.db.get("tutorialStates", siteId)) || null;
      } else {
        const stored = localStorage.getItem(`tutorial-state-${siteId}`);
        return stored ? JSON.parse(stored) : null;
      }
    } catch (error) {
      console.error("Error getting tutorial state:", error);
      return null;
    }
  }

  async setTutorialState(siteId: string, state: TutorialState): Promise<void> {
    try {
      if (this.db) {
        await this.db.put("tutorialStates", state, siteId);
      } else {
        localStorage.setItem(`tutorial-state-${siteId}`, JSON.stringify(state));
      }
    } catch (error) {
      console.error("Error setting tutorial state:", error);
    }
  }

  async getProgress(siteId: string): Promise<TutorialProgress | null> {
    try {
      if (this.db) {
        return (await this.db.get("progress", siteId)) || null;
      } else {
        const stored = localStorage.getItem(`progress-${siteId}`);
        return stored ? JSON.parse(stored) : null;
      }
    } catch (error) {
      console.error("Error getting progress:", error);
      return null;
    }
  }

  async setProgress(siteId: string, progress: TutorialProgress): Promise<void> {
    try {
      if (this.db) {
        await this.db.put("progress", progress, siteId);
      } else {
        localStorage.setItem(`progress-${siteId}`, JSON.stringify(progress));
      }
    } catch (error) {
      console.error("Error setting progress:", error);
    }
  }

  async getSettings(): Promise<ExtensionSettings | null> {
    try {
      if (this.db) {
        return (await this.db.get("settings", "main")) || null;
      } else {
        const stored = localStorage.getItem("extension-settings");
        return stored ? JSON.parse(stored) : null;
      }
    } catch (error) {
      console.error("Error getting settings:", error);
      return null;
    }
  }

  async setSettings(settings: ExtensionSettings): Promise<void> {
    try {
      if (this.db) {
        await this.db.put("settings", settings, "main");
      } else {
        localStorage.setItem("extension-settings", JSON.stringify(settings));
      }
    } catch (error) {
      console.error("Error setting settings:", error);
    }
  }

  async getAllProgress(): Promise<Record<string, TutorialProgress>> {
    try {
      if (this.db) {
        const tx = this.db.transaction("progress", "readonly");
        const store = tx.objectStore("progress");
        const keys = await store.getAllKeys();
        const values = await store.getAll();

        const result: Record<string, TutorialProgress> = {};
        keys.forEach((key, index) => {
          result[key as string] = values[index];
        });
        return result;
      } else {
        const result: Record<string, TutorialProgress> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith("progress-")) {
            const siteId = key.replace("progress-", "");
            const stored = localStorage.getItem(key);
            if (stored) {
              result[siteId] = JSON.parse(stored);
            }
          }
        }
        return result;
      }
    } catch (error) {
      console.error("Error getting all progress:", error);
      return {};
    }
  }

  async clearAll(): Promise<void> {
    try {
      if (this.db) {
        const tx = this.db.transaction(
          ["tutorialStates", "progress"],
          "readwrite",
        );
        await tx.objectStore("tutorialStates").clear();
        await tx.objectStore("progress").clear();
        await tx.done;
      } else {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (
            key?.startsWith("tutorial-state-") ||
            key?.startsWith("progress-")
          ) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
      }
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
  }
}

export const storageService = new StorageService();
