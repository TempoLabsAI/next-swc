import { TutorialState, ExtensionSettings } from "../types";

// Background service worker for the AI Tutor extension
class BackgroundService {
  private tutorialCheckInterval: number | null = null;
  private activeTabs: Set<number> = new Set();

  constructor() {
    this.setupMessageHandlers();
    this.setupStorageHandlers();
    this.setupTabHandlers();
    this.setupAlarms();
    this.initializeExtension();
  }

  private async initializeExtension() {
    try {
      // Set default settings if not exists
      const result = await chrome.storage.local.get([
        "extensionSettings",
        "installationDate",
      ]);

      if (!result.extensionSettings) {
        const defaultSettings: ExtensionSettings = {
          language: navigator.language.split("-")[0] || "en",
          voiceEnabled: false,
          aiProvider: "openrouter",
          autoDetectTutorials: true,
          showIntroduction: true,
          badgeNotifications: true,
        };
        await chrome.storage.local.set({ extensionSettings: defaultSettings });
      }

      // Set installation date if not exists
      if (!result.installationDate) {
        await chrome.storage.local.set({ installationDate: Date.now() });
      }

      // Initialize badge
      await chrome.action.setBadgeBackgroundColor({ color: "#3b82f6" });
      await chrome.action.setBadgeText({ text: "" });

      console.log("AI Tutor Extension initialized successfully");
    } catch (error) {
      console.error("Failed to initialize extension:", error);
    }
  }

  private setupMessageHandlers() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case "GET_TUTORIAL_STATE":
          this.getTutorialState(message.siteId, sendResponse);
          return true;
        case "UPDATE_TUTORIAL_STATE":
          this.updateTutorialState(message.siteId, message.data, sendResponse);
          return true;
        case "RESET_TUTORIAL":
          this.resetTutorial(message.siteId, sendResponse);
          return true;
        case "SITE_DETECTED":
          this.handleSiteDetection(sender.tab?.id, message.data, sendResponse);
          return true;
        case "UPDATE_BADGE":
          this.updateBadge(sender.tab?.id, message.data);
          break;
        case "GET_SETTINGS":
          this.getSettings(sendResponse);
          return true;
        case "UPDATE_SETTINGS":
          this.updateSettings(message.data, sendResponse);
          return true;
        default:
          break;
      }
    });
  }

  private setupStorageHandlers() {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === "local") {
        // Notify all content scripts of relevant changes
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            if (tab.id && this.activeTabs.has(tab.id)) {
              if (changes.tutorialState) {
                chrome.tabs.sendMessage(tab.id, {
                  type: "TUTORIAL_STATE_CHANGED",
                  data: changes.tutorialState.newValue,
                });
              }
              if (changes.extensionSettings) {
                chrome.tabs.sendMessage(tab.id, {
                  type: "SETTINGS_CHANGED",
                  data: changes.extensionSettings.newValue,
                });
              }
            }
          });
        });
      }
    });
  }

  private setupTabHandlers() {
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      this.activeTabs.add(activeInfo.tabId);
      await this.checkForTutorialOpportunity(activeInfo.tabId);
    });

    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (changeInfo.status === "complete" && tab.url) {
        this.activeTabs.add(tabId);
        await this.checkForTutorialOpportunity(tabId);
      }
    });

    chrome.tabs.onRemoved.addListener((tabId) => {
      this.activeTabs.delete(tabId);
    });
  }

  private setupAlarms() {
    // Create periodic check for tutorial opportunities
    chrome.alarms.create("tutorialCheck", { periodInMinutes: 5 });

    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === "tutorialCheck") {
        this.performPeriodicTutorialCheck();
      }
    });
  }

  private async checkForTutorialOpportunity(tabId: number) {
    try {
      const settings = await this.getSettingsInternal();
      if (!settings.autoDetectTutorials) return;

      // Get tab info first
      const tab = await chrome.tabs.get(tabId);
      if (
        !tab.url ||
        tab.url.startsWith("chrome://") ||
        tab.url.startsWith("chrome-extension://")
      ) {
        return;
      }

      // Inject content script to check for tutorial opportunities
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          // This will be executed in the content script context
          if ((window as any).aiTutorContentScript) {
            (window as any).aiTutorContentScript.checkTutorialOpportunity();
          }
        },
      });
    } catch (error) {
      console.warn("Failed to check tutorial opportunity:", error);
    }
  }

  private async performPeriodicTutorialCheck() {
    const settings = await this.getSettingsInternal();
    if (!settings.autoDetectTutorials) return;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id && this.activeTabs.has(tab.id)) {
          this.checkForTutorialOpportunity(tab.id);
        }
      });
    });
  }

  private async handleSiteDetection(
    tabId: number | undefined,
    data: { siteId: string; siteName: string; isCompatible: boolean },
    sendResponse: (response: any) => void,
  ) {
    try {
      const settings = await this.getSettingsInternal();

      if (data.isCompatible && settings.badgeNotifications && tabId) {
        // Show badge notification
        await chrome.action.setBadgeText({ text: "!", tabId });
        await chrome.action.setBadgeBackgroundColor({
          color: "#3b82f6",
          tabId,
        });
        await chrome.action.setTitle({
          title: `AI Tutor available for ${data.siteName}`,
          tabId,
        });
      }

      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  private async updateBadge(
    tabId: number | undefined,
    data: { text?: string; color?: string; title?: string },
  ) {
    if (!tabId) return;

    try {
      if (data.text !== undefined) {
        await chrome.action.setBadgeText({ text: data.text, tabId });
      }
      if (data.color) {
        await chrome.action.setBadgeBackgroundColor({
          color: data.color,
          tabId,
        });
      }
      if (data.title) {
        await chrome.action.setTitle({ title: data.title, tabId });
      }
    } catch (error) {
      console.warn("Failed to update badge:", error);
    }
  }

  private async getTutorialState(
    siteId: string,
    sendResponse: (response: any) => void,
  ) {
    try {
      const key = `tutorialState_${siteId}`;
      const result = await chrome.storage.local.get(key);
      const defaultState: TutorialState = {
        isActive: false,
        currentStep: 0,
        totalSteps: 0,
        completedSteps: [],
        language: "en",
        voiceEnabled: false,
        siteId,
        sessionId: this.generateSessionId(),
        startTime: Date.now(),
        lastActiveTime: Date.now(),
        isIntroductionShown: false,
      };
      sendResponse({
        success: true,
        data: result[key] || defaultState,
      });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  private async updateTutorialState(
    siteId: string,
    data: Partial<TutorialState>,
    sendResponse: (response: any) => void,
  ) {
    try {
      const key = `tutorialState_${siteId}`;
      const result = await chrome.storage.local.get(key);
      const currentState = result[key] || {};
      const newState = {
        ...currentState,
        ...data,
        lastActiveTime: Date.now(),
        siteId,
      };
      await chrome.storage.local.set({ [key]: newState });
      sendResponse({ success: true, data: newState });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  private async resetTutorial(
    siteId: string,
    sendResponse: (response: any) => void,
  ) {
    try {
      const key = `tutorialState_${siteId}`;
      await chrome.storage.local.remove(key);

      // Clear badge for all tabs
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            chrome.action.setBadgeText({ text: "", tabId: tab.id });
          }
        });
      });

      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  private async getSettings(sendResponse: (response: any) => void) {
    try {
      const settings = await this.getSettingsInternal();
      sendResponse({ success: true, data: settings });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  private async getSettingsInternal(): Promise<ExtensionSettings> {
    const result = await chrome.storage.local.get("extensionSettings");
    return (
      result.extensionSettings || {
        language: "en",
        voiceEnabled: false,
        aiProvider: "openrouter",
        autoDetectTutorials: true,
        showIntroduction: true,
        badgeNotifications: true,
      }
    );
  }

  private async updateSettings(
    data: Partial<ExtensionSettings>,
    sendResponse: (response: any) => void,
  ) {
    try {
      const currentSettings = await this.getSettingsInternal();
      const newSettings = { ...currentSettings, ...data };
      await chrome.storage.local.set({ extensionSettings: newSettings });
      sendResponse({ success: true, data: newSettings });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Initialize the background service
new BackgroundService();

export {};
