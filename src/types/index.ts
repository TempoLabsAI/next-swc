export interface TutorialState {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  language: string;
  voiceEnabled: boolean;
  siteId?: string;
  sessionId?: string;
  startTime?: number;
  lastActiveTime?: number;
  isIntroductionShown?: boolean;
}

export interface TutorialStep {
  id: string;
  selector: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
  language: string;
  priority?: number;
  category?: string;
  estimatedTime?: number;
}

export interface AIResponse {
  guidance: string;
  nextAction?: string;
  confidence: number;
}

export interface ExtensionSettings {
  language: string;
  voiceEnabled: boolean;
  openRouterApiKey?: string;
  geminiApiKey?: string;
  aiProvider: "openrouter" | "gemini";
  autoDetectTutorials?: boolean;
  showIntroduction?: boolean;
  badgeNotifications?: boolean;
}

export interface ElementContext {
  tagName: string;
  textContent: string;
  attributes: Record<string, string>;
  position: DOMRect;
  isInteractive: boolean;
}

export interface SiteDetectionRule {
  id: string;
  domain: string;
  selectors: string[];
  name: string;
  description: string;
  priority: number;
}

export interface TutorialProgress {
  siteId: string;
  completedSteps: string[];
  totalSteps: number;
  completionPercentage: number;
  lastVisited: number;
  isCompleted: boolean;
}

export interface TutorialIntroduction {
  title: string;
  description: string;
  estimatedTime: string;
  features: string[];
  onStart: () => void;
  onSkip: () => void;
}
