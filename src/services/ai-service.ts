import {
  ElementContext,
  TutorialStep,
  AIResponse,
  ExtensionSettings,
} from "../types";
import i18n from "./i18n-service";

export class AIService {
  private settings: ExtensionSettings | null = null;

  constructor() {
    this.loadSettings();
  }

  private async loadSettings(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.get("extensionSettings", (result) => {
        this.settings = result.extensionSettings || {
          language: "en",
          voiceEnabled: false,
          aiProvider: "openrouter",
        };
        resolve();
      });
    });
  }

  async getGuidance(
    context: ElementContext,
    step: TutorialStep,
  ): Promise<string | null> {
    if (!this.settings) {
      await this.loadSettings();
    }

    try {
      // Check if AI provider is configured
      if (
        this.settings!.aiProvider === "openrouter" &&
        this.settings!.openRouterApiKey
      ) {
        return await this.getOpenRouterGuidance(context, step);
      } else if (
        this.settings!.aiProvider === "gemini" &&
        this.settings!.geminiApiKey
      ) {
        return await this.getGeminiGuidance(context, step);
      } else {
        // Fallback to enhanced static guidance
        return this.getEnhancedStaticGuidance(context, step);
      }
    } catch (error) {
      console.warn("AI service error:", error);
      // Fallback to enhanced static guidance on error
      return this.getEnhancedStaticGuidance(context, step);
    }
  }

  private getEnhancedStaticGuidance(
    context: ElementContext,
    step: TutorialStep,
  ): string {
    const elementType = context.tagName.toLowerCase();
    const hasText = context.textContent.trim().length > 0;
    const isButton =
      elementType === "button" || context.attributes.role === "button";
    const isInput = elementType === "input" || elementType === "textarea";
    const isLink = elementType === "a";

    let guidance = step.description;

    // Enhance guidance based on element context
    if (isButton && hasText) {
      guidance = `Click the "${context.textContent.trim()}" button to ${step.description.toLowerCase()}`;
    } else if (isInput) {
      const inputType = context.attributes.type || "text";
      const placeholder = context.attributes.placeholder;
      if (placeholder) {
        guidance = `Enter information in the ${inputType} field (${placeholder})`;
      } else {
        guidance = `Fill in this ${inputType} field to continue`;
      }
    } else if (isLink && hasText) {
      guidance = `Click on "${context.textContent.trim()}" to navigate to the next section`;
    } else if (hasText) {
      guidance = `Interact with "${context.textContent.trim()}" - ${step.description}`;
    }

    return guidance;
  }

  private async getOpenRouterGuidance(
    context: ElementContext,
    step: TutorialStep,
  ): Promise<string> {
    const prompt = this.buildPrompt(context, step);

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.settings!.openRouterApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "AI Tutor Extension",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3-haiku",
          messages: [
            {
              role: "system",
              content:
                "You are an AI tutor helping users learn web interfaces. Provide clear, concise guidance in 1-2 sentences. Be encouraging and specific about what action to take.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 150,
          temperature: 0.7,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || step.description;
  }

  private async getGeminiGuidance(
    context: ElementContext,
    step: TutorialStep,
  ): Promise<string> {
    const prompt = this.buildPrompt(context, step);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.settings!.geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an AI tutor helping users learn web interfaces. Provide clear, concise guidance in 1-2 sentences. Be encouraging and specific about what action to take.\n\n${prompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 150,
            temperature: 0.7,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || step.description;
  }

  private buildPrompt(context: ElementContext, step: TutorialStep): string {
    const elementInfo = {
      type: context.tagName.toLowerCase(),
      text: context.textContent.substring(0, 100),
      isButton: context.tagName === "BUTTON",
      isInput: context.tagName === "INPUT",
      isLink: context.tagName === "A",
      hasPlaceholder: context.attributes.placeholder,
      hasLabel: context.attributes["aria-label"] || context.attributes.title,
    };

    const currentLanguage = this.settings?.language || i18n.language || "en";
    const languageInstruction =
      currentLanguage !== "en"
        ? `Please respond in ${this.getLanguageName(currentLanguage)}.`
        : "";

    return `
I'm tutoring a user on this webpage element:
- Element type: ${elementInfo.type}
- Text content: "${elementInfo.text}"
- Interactive: ${context.isInteractive}
- Current step: ${step.title}
- Step description: ${step.description}

Provide helpful guidance for what the user should do with this element. Be specific and encouraging. ${languageInstruction}
`;
  }

  private getLanguageName(code: string): string {
    const languages: Record<string, string> = {
      en: "English",
      es: "Spanish",
      fr: "French",
      de: "German",
      it: "Italian",
      pt: "Portuguese",
      ru: "Russian",
      ja: "Japanese",
      ko: "Korean",
      zh: "Chinese",
    };
    return languages[code] || "English";
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.settings) {
      await this.loadSettings();
    }

    try {
      if (
        this.settings!.aiProvider === "openrouter" &&
        this.settings!.openRouterApiKey
      ) {
        const response = await fetch("https://openrouter.ai/api/v1/models", {
          headers: {
            Authorization: `Bearer ${this.settings!.openRouterApiKey}`,
          },
        });

        if (response.ok) {
          return { success: true, message: "OpenRouter connection successful" };
        } else {
          return { success: false, message: "OpenRouter API key invalid" };
        }
      } else if (
        this.settings!.aiProvider === "gemini" &&
        this.settings!.geminiApiKey
      ) {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${this.settings!.geminiApiKey}`,
        );

        if (response.ok) {
          return { success: true, message: "Gemini connection successful" };
        } else {
          return { success: false, message: "Gemini API key invalid" };
        }
      } else {
        return { success: false, message: "No API key configured" };
      }
    } catch (error) {
      return { success: false, message: `Connection failed: ${error.message}` };
    }
  }
}
