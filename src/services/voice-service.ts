export class VoiceService {
  private synthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isEnabled: boolean = false;
  private currentLanguage: string = "en";
  private settings: {
    rate: number;
    pitch: number;
    volume: number;
  } = {
    rate: 0.9,
    pitch: 1,
    volume: 0.8,
  };

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.loadVoices();
    this.loadSettings();

    // Load voices when they become available
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  private async loadSettings() {
    try {
      const result = await chrome.storage.local.get([
        "extensionSettings",
        "voiceSettings",
      ]);
      if (result.extensionSettings) {
        this.isEnabled = result.extensionSettings.voiceEnabled || false;
        this.currentLanguage = result.extensionSettings.language || "en";
      }
      if (result.voiceSettings) {
        this.settings = { ...this.settings, ...result.voiceSettings };
      }
    } catch (error) {
      console.warn("Failed to load voice settings:", error);
    }
  }

  async updateSettings(settings: Partial<typeof this.settings>) {
    this.settings = { ...this.settings, ...settings };
    try {
      await chrome.storage.local.set({ voiceSettings: this.settings });
    } catch (error) {
      console.warn("Failed to save voice settings:", error);
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  setLanguage(language: string) {
    this.currentLanguage = language;
  }

  getSettings() {
    return { ...this.settings };
  }

  private loadVoices() {
    this.voices = this.synthesis.getVoices();
  }

  speak(text: string, language?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if voice is enabled
      if (!this.isEnabled) {
        resolve();
        return;
      }

      // Stop any current speech
      this.stop();

      if (!text.trim()) {
        resolve();
        return;
      }

      const targetLanguage = language || this.currentLanguage;
      this.currentUtterance = new SpeechSynthesisUtterance(text);

      // Find appropriate voice for language
      const voice = this.findVoiceForLanguage(targetLanguage);
      if (voice) {
        this.currentUtterance.voice = voice;
      }

      // Set speech parameters
      this.currentUtterance.rate = this.settings.rate;
      this.currentUtterance.pitch = this.settings.pitch;
      this.currentUtterance.volume = this.settings.volume;
      this.currentUtterance.lang = this.getLanguageCode(targetLanguage);

      // Event handlers
      this.currentUtterance.onerror = (event) => {
        console.warn("Speech synthesis error:", event.error);
        this.currentUtterance = null;
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.currentUtterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };

      this.currentUtterance.onstart = () => {
        // Speech started successfully
      };

      try {
        this.synthesis.speak(this.currentUtterance);
      } catch (error) {
        this.currentUtterance = null;
        reject(error);
      }
    });
  }

  stop(): void {
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }
    this.currentUtterance = null;
  }

  pause(): void {
    if (this.synthesis.speaking && !this.synthesis.paused) {
      this.synthesis.pause();
    }
  }

  resume(): void {
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  isSpeaking(): boolean {
    return this.synthesis.speaking;
  }

  isPaused(): boolean {
    return this.synthesis.paused;
  }

  private findVoiceForLanguage(language: string): SpeechSynthesisVoice | null {
    const langCode = this.getLanguageCode(language);

    // Try to find exact match
    let voice = this.voices.find((v) => v.lang === langCode);

    // Try to find language family match (e.g., 'en' for 'en-US')
    if (!voice) {
      const langFamily = langCode.split("-")[0];
      voice = this.voices.find((v) => v.lang.startsWith(langFamily));
    }

    // Prefer local voices
    if (voice && !voice.localService) {
      const localVoice = this.voices.find(
        (v) =>
          (v.lang === langCode || v.lang.startsWith(langCode.split("-")[0])) &&
          v.localService,
      );
      if (localVoice) {
        voice = localVoice;
      }
    }

    return voice || null;
  }

  private getLanguageCode(language: string): string {
    const languageCodes: Record<string, string> = {
      en: "en-US",
      es: "es-ES",
      fr: "fr-FR",
      de: "de-DE",
      it: "it-IT",
      pt: "pt-PT",
      ru: "ru-RU",
      ja: "ja-JP",
      ko: "ko-KR",
      zh: "zh-CN",
      ar: "ar-SA",
      hi: "hi-IN",
    };

    return languageCodes[language] || language;
  }

  getAvailableVoices(language?: string): SpeechSynthesisVoice[] {
    if (!language) {
      return this.voices;
    }

    const langCode = this.getLanguageCode(language);
    const langFamily = langCode.split("-")[0];

    return this.voices.filter(
      (voice) => voice.lang === langCode || voice.lang.startsWith(langFamily),
    );
  }

  async testVoice(language: string): Promise<void> {
    const testText = this.getTestText(language);
    this.speak(testText, language);
  }

  private getTestText(language: string): string {
    const testTexts: Record<string, string> = {
      en: "Hello! This is a test of the voice synthesis.",
      es: "¡Hola! Esta es una prueba de la síntesis de voz.",
      fr: "Bonjour! Ceci est un test de la synthèse vocale.",
      de: "Hallo! Dies ist ein Test der Sprachsynthese.",
      it: "Ciao! Questo è un test della sintesi vocale.",
      pt: "Olá! Este é um teste da síntese de voz.",
      ru: "Привет! Это тест синтеза речи.",
      ja: "こんにちは！これは音声合成のテストです。",
      ko: "안녕하세요! 이것은 음성 합성 테스트입니다.",
      zh: "你好！这是语音合成测试。",
      ar: "مرحبا! هذا اختبار لتركيب الكلام.",
      hi: "नमस्ते! यह वॉयस सिंथेसिस का परीक्षण है।",
    };

    return testTexts[language] || testTexts["en"];
  }
}
