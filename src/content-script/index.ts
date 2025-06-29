import { TutorialState, TutorialStep, ElementContext, TutorialIntroduction } from "../types";
import { HighlightManager } from "./highlight-manager";
import { AIService } from "../services/ai-service";
import { VoiceService } from "../services/voice-service";
import { siteDetectionService } from "../services/site-detection-service";
import { storageService } from "../services/storage-service";
import { useTutorialStore } from "../stores/tutorial-store";
import { TutorialIntroductionComponent } from "../components/tutorial-introduction";
import { TutorialProgress } from "../components/tutorial-progress";
import i18n from "../services/i18n-service";
import { createRoot } from "react-dom/client";
import React from "react";
import "./content-script.css";

class ContentScript {
  private highlightManager: HighlightManager;
  private aiService: AIService;
  private voiceService: VoiceService;
  private tutorialState: TutorialState | null = null;
  private currentSteps: TutorialStep[] = [];
  private siteId: string;
  private introductionRoot: any = null;
  private progressRoot: any = null;
  private isInitialized = false;

  constructor() {
    this.highlightManager = new HighlightManager();
    this.aiService = new AIService();
    this.voiceService = new VoiceService();
    this.siteId = siteDetectionService.getSiteId();
    this.init();
    
    // Make this available globally for background script communication
    (window as any).aiTutorContentScript = this;
  }

  private async init() {
    try {
      // Initialize storage service
      await storageService.init();
      
      // Load settings and set language
      const settings = await this.loadSettings();
      if (settings) {
        i18n.changeLanguage(settings.language);
      }
      
      await this.loadTutorialState();
      this.setupMessageHandlers();
      this.setupDOMObserver();
      
      // Check for tutorial opportunities
      await this.checkTutorialOpportunity();
      
      if (this.tutorialState?.isActive) {
        this.startTutorial();
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize AI Tutor:', error);
    }
  }

  private setupMessageHandlers() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case "START_TUTORIAL":
          this.startTutorial();
          break;
        case "STOP_TUTORIAL":
          this.stopTutorial();
          break;
        case "NEXT_STEP":
          this.nextStep();
          break;
        case "PREVIOUS_STEP":
          this.previousStep();
          break;
        case "SKIP_TUTORIAL":
          this.skipTutorial();
          break;
        case "TUTORIAL_STATE_CHANGED":
          this.tutorialState = message.data;
          this.updateTutorialDisplay();
          break;
        case "SETTINGS_CHANGED":
          this.handleSettingsChange(message.data);
          break;
        case "SHOW_INTRODUCTION":
          this.showIntroduction();
          break;
      }
    });
  }

  private setupDOMObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          shouldUpdate = true;
        }
      });

      if (shouldUpdate && this.tutorialState?.isActive) {
        setTimeout(() => this.updateHighlights(), 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private async loadTutorialState() {
    return new Promise<void>((resolve) => {
      chrome.runtime.sendMessage({ 
        type: "GET_TUTORIAL_STATE", 
        siteId: this.siteId 
      }, (response) => {
        if (response?.success) {
          this.tutorialState = response.data;
        }
        resolve();
      });
    });
  }
  
  private async loadSettings() {
    return new Promise<any>((resolve) => {
      chrome.runtime.sendMessage({ type: "GET_SETTINGS" }, (response) => {
        if (response?.success) {
          resolve(response.data);
        } else {
          resolve(null);
        }
      });
    });
  }

  private async startTutorial() {
    // Check if introduction should be shown first
    const settings = await this.loadSettings();
    if (settings?.showIntroduction && !this.tutorialState?.isIntroductionShown) {
      this.showIntroduction();
      return;
    }
    
    this.currentSteps = await this.generateTutorialSteps();

    if (this.currentSteps.length === 0) {
      console.warn("No tutorial steps found for this page");
      return;
    }

    const newState: Partial<TutorialState> = {
      isActive: true,
      currentStep: 0,
      totalSteps: this.currentSteps.length,
      completedSteps: [],
      startTime: Date.now(),
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    chrome.runtime.sendMessage({
      type: "UPDATE_TUTORIAL_STATE",
      siteId: this.siteId,
      data: newState,
    });

    // Update badge
    chrome.runtime.sendMessage({
      type: "UPDATE_BADGE",
      data: { text: "1", color: "#10b981", title: "Tutorial in progress" }
    });

    this.showCurrentStep();
    this.showProgressVisualization();
  }

  private stopTutorial() {
    this.highlightManager.clearAllHighlights();
    this.hideProgressVisualization();
    
    chrome.runtime.sendMessage({
      type: "UPDATE_TUTORIAL_STATE",
      siteId: this.siteId,
      data: { isActive: false },
    });
    
    // Clear badge
    chrome.runtime.sendMessage({
      type: "UPDATE_BADGE",
      data: { text: "", title: "AI Tutor" }
    });
  }

  private nextStep() {
    if (
      !this.tutorialState ||
      this.tutorialState.currentStep >= this.currentSteps.length - 1
    ) {
      this.completeTutorial();
      return;
    }

    const nextStep = this.tutorialState.currentStep + 1;
    const completedSteps = [
      ...this.tutorialState.completedSteps,
      this.tutorialState.currentStep,
    ];

    chrome.runtime.sendMessage({
      type: "UPDATE_TUTORIAL_STATE",
      siteId: this.siteId,
      data: { currentStep: nextStep, completedSteps },
    });
    
    // Update badge with progress
    const progress = Math.round(((nextStep + 1) / this.currentSteps.length) * 100);
    chrome.runtime.sendMessage({
      type: "UPDATE_BADGE",
      data: { text: `${progress}%`, color: "#10b981" }
    });
  }

  private previousStep() {
    if (!this.tutorialState || this.tutorialState.currentStep <= 0) {
      return;
    }

    const prevStep = this.tutorialState.currentStep - 1;
    chrome.runtime.sendMessage({
      type: "UPDATE_TUTORIAL_STATE",
      siteId: this.siteId,
      data: { currentStep: prevStep },
    });
    
    // Update badge with progress
    const progress = Math.round(((prevStep + 1) / this.currentSteps.length) * 100);
    chrome.runtime.sendMessage({
      type: "UPDATE_BADGE",
      data: { text: `${progress}%`, color: "#10b981" }
    });
  }

  private skipTutorial() {
    this.stopTutorial();
  }

  private completeTutorial() {
    this.highlightManager.clearAllHighlights();
    this.hideProgressVisualization();
    
    chrome.runtime.sendMessage({
      type: "UPDATE_TUTORIAL_STATE",
      siteId: this.siteId,
      data: { isActive: false, currentStep: 0 },
    });
    
    // Update badge to show completion
    chrome.runtime.sendMessage({
      type: "UPDATE_BADGE",
      data: { text: "✓", color: "#10b981", title: "Tutorial completed!" }
    });

    // Show completion message
    this.showCompletionMessage();
    
    // Store completion in Zustand store
    const store = useTutorialStore.getState();
    store.completeTutorial(this.siteId);
  }

  private async showCurrentStep() {
    if (
      !this.tutorialState ||
      !this.currentSteps[this.tutorialState.currentStep]
    ) {
      return;
    }

    const step = this.currentSteps[this.tutorialState.currentStep];
    const element = document.querySelector(step.selector) as HTMLElement;

    if (!element) {
      console.warn(`Element not found for selector: ${step.selector}`);
      this.nextStep();
      return;
    }

    // Get AI-enhanced guidance
    const elementContext = this.getElementContext(element);
    const aiGuidance = await this.aiService.getGuidance(elementContext, step);

    // Show highlight with tooltip
    this.highlightManager.highlightElement(element, {
      title: step.title,
      description: aiGuidance || step.description,
      position: step.position,
      onNext: () => this.nextStep(),
      onPrevious: () => this.previousStep(),
      onSkip: () => this.skipTutorial(),
      showPrevious: this.tutorialState!.currentStep > 0,
      showNext: this.tutorialState!.currentStep < this.currentSteps.length - 1,
    });

    // Play voice if enabled
    if (this.tutorialState.voiceEnabled) {
      this.voiceService.speak(
        aiGuidance || step.description,
        this.tutorialState.language,
      );
    }
  }

  private updateTutorialDisplay() {
    if (this.tutorialState?.isActive) {
      this.showCurrentStep();
      this.updateProgressVisualization();
    } else {
      this.highlightManager.clearAllHighlights();
      this.hideProgressVisualization();
    }
  }

  private updateHighlights() {
    if (this.tutorialState?.isActive) {
      this.showCurrentStep();
    }
  }

  private async generateTutorialSteps(): Promise<TutorialStep[]> {
    const interactiveElements = this.findInteractiveElements();
    const steps: TutorialStep[] = [];

    for (let i = 0; i < Math.min(interactiveElements.length, 5); i++) {
      const element = interactiveElements[i];
      const context = this.getElementContext(element);

      steps.push({
        id: `step-${i}`,
        selector: this.generateSelector(element),
        title: `Step ${i + 1}`,
        description: `Interact with this ${context.tagName.toLowerCase()}`,
        position: "bottom",
        language: this.tutorialState?.language || "en",
      });
    }

    return steps;
  }

  private findInteractiveElements(): HTMLElement[] {
    const selectors = [
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "a[href]",
      '[role="button"]',
      '[tabindex="0"]',
    ];

    const elements: HTMLElement[] = [];
    selectors.forEach((selector) => {
      const found = document.querySelectorAll(
        selector,
      ) as NodeListOf<HTMLElement>;
      found.forEach((el) => {
        if (this.isElementVisible(el) && !elements.includes(el)) {
          elements.push(el);
        }
      });
    });

    return elements.slice(0, 10); // Limit to first 10 elements
  }

  private isElementVisible(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);

    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.visibility !== "hidden" &&
      style.display !== "none" &&
      rect.top < window.innerHeight &&
      rect.bottom > 0
    );
  }

  private getElementContext(element: HTMLElement): ElementContext {
    const rect = element.getBoundingClientRect();
    const attributes: Record<string, string> = {};

    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      attributes[attr.name] = attr.value;
    }

    return {
      tagName: element.tagName,
      textContent: element.textContent?.trim() || "",
      attributes,
      position: rect,
      isInteractive: this.isInteractiveElement(element),
    };
  }

  private isInteractiveElement(element: HTMLElement): boolean {
    const interactiveTags = ["BUTTON", "INPUT", "SELECT", "TEXTAREA", "A"];
    return (
      interactiveTags.includes(element.tagName) ||
      element.hasAttribute("onclick") ||
      element.getAttribute("role") === "button" ||
      element.tabIndex >= 0
    );
  }

  private generateSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${element.id}`;
    }

    if (element.className) {
      const classes = element.className.split(" ").filter((c) => c.length > 0);
      if (classes.length > 0) {
        return `${element.tagName.toLowerCase()}.${classes[0]}`;
      }
    }

    // Fallback to nth-child selector
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      const index = siblings.indexOf(element) + 1;
      return `${parent.tagName.toLowerCase()} > ${element.tagName.toLowerCase()}:nth-child(${index})`;
    }

    return element.tagName.toLowerCase();
  }

  private showCompletionMessage() {
    const message = document.createElement("div");
    message.className = "ai-tutor-completion";
    message.innerHTML = `
      <div class="ai-tutor-completion-content">
        <h3>${i18n.t('tutorial.completed')}</h3>
        <p>${i18n.t('tutorial.completedDescription')}</p>
        <button class="ai-tutor-btn ai-tutor-btn-primary" onclick="this.parentElement.parentElement.remove()">${i18n.t('tutorial.close')}</button>
      </div>
    `;
    document.body.appendChild(message);

    setTimeout(() => {
      if (message.parentElement) {
        message.remove();
      }
    }, 5000);
  }
}

  public async checkTutorialOpportunity() {
    if (!this.isInitialized) return;
    
    const isCompatible = siteDetectionService.isCompatibleSite();
    const siteName = siteDetectionService.getSiteName();
    
    // Notify background script about site detection
    chrome.runtime.sendMessage({
      type: "SITE_DETECTED",
      data: {
        siteId: this.siteId,
        siteName,
        isCompatible
      }
    });
  }
  
  private async handleSettingsChange(settings: any) {
    if (settings.language) {
      i18n.changeLanguage(settings.language);
    }
  }
  
  private showIntroduction() {
    const siteName = siteDetectionService.getSiteName();
    const siteDescription = siteDetectionService.getSiteDescription();
    
    const introduction: TutorialIntroduction = {
      title: i18n.t('tutorial.introduction.title'),
      description: siteDescription,
      estimatedTime: "3-5",
      features: [
        i18n.t('tutorial.introduction.features.0'),
        i18n.t('tutorial.introduction.features.1'),
        i18n.t('tutorial.introduction.features.2'),
        i18n.t('tutorial.introduction.features.3')
      ],
      onStart: () => {
        this.hideIntroduction();
        chrome.runtime.sendMessage({
          type: "UPDATE_TUTORIAL_STATE",
          siteId: this.siteId,
          data: { isIntroductionShown: true },
        });
        this.startTutorial();
      },
      onSkip: () => {
        this.hideIntroduction();
        chrome.runtime.sendMessage({
          type: "UPDATE_TUTORIAL_STATE",
          siteId: this.siteId,
          data: { isIntroductionShown: true },
        });
      }
    };
    
    // Create introduction container
    const container = document.createElement('div');
    container.id = 'ai-tutor-introduction-root';
    document.body.appendChild(container);
    
    this.introductionRoot = createRoot(container);
    this.introductionRoot.render(
      React.createElement(TutorialIntroductionComponent, {
        introduction,
        siteName,
        onClose: () => this.hideIntroduction()
      })
    );
  }
  
  private hideIntroduction() {
    if (this.introductionRoot) {
      this.introductionRoot.unmount();
      this.introductionRoot = null;
    }
    const container = document.getElementById('ai-tutor-introduction-root');
    if (container) {
      container.remove();
    }
  }
  
  private showProgressVisualization() {
    if (!this.tutorialState) return;
    
    // Create progress container
    const container = document.createElement('div');
    container.id = 'ai-tutor-progress-root';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9997;
      max-width: 300px;
    `;
    document.body.appendChild(container);
    
    this.progressRoot = createRoot(container);
    this.progressRoot.render(
      React.createElement(TutorialProgress, {
        tutorialState: this.tutorialState
      })
    );
  }
  
  private hideProgressVisualization() {
    if (this.progressRoot) {
      this.progressRoot.unmount();
      this.progressRoot = null;
    }
    const container = document.getElementById('ai-tutor-progress-root');
    if (container) {
      container.remove();
    }
  }
  
  private updateProgressVisualization() {
    if (this.progressRoot && this.tutorialState) {
      this.progressRoot.render(
        React.createElement(TutorialProgress, {
          tutorialState: this.tutorialState
        })
      );
    }
  }
}

// Initialize content script
new ContentScript();

export {};
