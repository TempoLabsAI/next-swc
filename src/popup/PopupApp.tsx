import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { ExtensionSettings, TutorialState } from "../types";
import { AIService } from "../services/ai-service";
import { VoiceService } from "../services/voice-service";
import { useTutorialStore } from "../stores/tutorial-store";
import i18n from "../services/i18n-service";
import {
  Play,
  Settings,
  Globe,
  Volume2,
  VolumeX,
  CheckCircle,
  XCircle,
  Bell,
  BellOff,
  Eye,
  EyeOff,
  Zap,
  ZapOff,
} from "lucide-react";

interface ConnectionStatus {
  isConnected: boolean;
  message: string;
  isLoading: boolean;
}

export function PopupApp() {
  const { t } = useTranslation();
  const tutorialStore = useTutorialStore();

  const [settings, setSettings] = useState<ExtensionSettings>({
    language: "en",
    voiceEnabled: false,
    aiProvider: "openrouter",
    autoDetectTutorials: true,
    showIntroduction: true,
    badgeNotifications: true,
  });

  const [tutorialState, setTutorialState] = useState<TutorialState | null>(
    null,
  );
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    message: "",
    isLoading: false,
  });

  const [aiService] = useState(() => new AIService());
  const [voiceService] = useState(() => new VoiceService());

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" },
    { code: "it", name: "Italiano" },
    { code: "pt", name: "Português" },
    { code: "ru", name: "Русский" },
    { code: "ja", name: "日本語" },
    { code: "ko", name: "한국어" },
    { code: "zh", name: "中文" },
  ];

  useEffect(() => {
    loadSettings();
    loadTutorialState();
  }, []);

  const loadSettings = async () => {
    chrome.runtime.sendMessage({ type: "GET_SETTINGS" }, (response) => {
      if (response?.success) {
        setSettings(response.data);
        i18n.changeLanguage(response.data.language);
      }
    });
  };

  const loadTutorialState = async () => {
    chrome.runtime.sendMessage({ type: "GET_TUTORIAL_STATE" }, (response) => {
      if (response.success) {
        setTutorialState(response.data);
      }
    });
  };

  const saveSettings = async (newSettings: ExtensionSettings) => {
    setSettings(newSettings);
    chrome.storage.local.set({ extensionSettings: newSettings });
  };

  const startTutorial = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: "START_TUTORIAL" });
      window.close();
    }
  };

  const stopTutorial = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: "STOP_TUTORIAL" });
    }
  };

  const testConnection = async () => {
    setConnectionStatus({ isConnected: false, message: "", isLoading: true });

    try {
      const result = await aiService.testConnection();
      setConnectionStatus({
        isConnected: result.success,
        message: result.message,
        isLoading: false,
      });
    } catch (error) {
      setConnectionStatus({
        isConnected: false,
        message: "Connection test failed",
        isLoading: false,
      });
    }
  };

  const testVoice = () => {
    voiceService.testVoice(settings.language);
  };

  const resetTutorial = () => {
    chrome.runtime.sendMessage({ type: "RESET_TUTORIAL" });
    setTutorialState(null);
  };

  const getCurrentLanguageName = () => {
    return (
      languages.find((lang) => lang.code === settings.language)?.name ||
      "English"
    );
  };

  return (
    <div className="w-80 p-4 bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <Settings className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="font-semibold text-gray-900">AI Tutor</h1>
          <p className="text-xs text-gray-500">
            Interactive Learning Assistant
          </p>
        </div>
      </div>

      {/* Tutorial Controls */}
      <div className="mb-6">
        <h2 className="text-sm font-medium text-gray-900 mb-3">
          Tutorial Control
        </h2>

        {tutorialState?.isActive ? (
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">
                  Tutorial Active
                </span>
                <span className="text-xs text-blue-600">
                  Step {tutorialState.currentStep + 1} of{" "}
                  {tutorialState.totalSteps}
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((tutorialState.currentStep + 1) / tutorialState.totalSteps) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={stopTutorial}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Stop Tutorial
              </Button>
              <Button onClick={resetTutorial} variant="ghost" size="sm">
                Reset
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={startTutorial} className="w-full" size="sm">
            <Play className="w-4 h-4 mr-2" />
            Start Tutorial
          </Button>
        )}
      </div>

      {/* Language Settings */}
      <div className="mb-6">
        <h2 className="text-sm font-medium text-gray-900 mb-3">Language</h2>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {getCurrentLanguageName()}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full">
            {languages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() =>
                  saveSettings({ ...settings, language: lang.code })
                }
                className={settings.language === lang.code ? "bg-blue-50" : ""}
              >
                {lang.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Voice Settings */}
      <div className="mb-6">
        <h2 className="text-sm font-medium text-gray-900 mb-3">Voice</h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {settings.voiceEnabled ? (
                <Volume2 className="w-4 h-4 text-gray-600" />
              ) : (
                <VolumeX className="w-4 h-4 text-gray-400" />
              )}
              <Label htmlFor="voice-enabled" className="text-sm">
                Enable Voice
              </Label>
            </div>
            <Switch
              id="voice-enabled"
              checked={settings.voiceEnabled}
              onCheckedChange={(checked) =>
                saveSettings({ ...settings, voiceEnabled: checked })
              }
            />
          </div>

          {settings.voiceEnabled && (
            <Button
              onClick={testVoice}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Test Voice
            </Button>
          )}
        </div>
      </div>

      {/* AI Provider Settings */}
      <div className="mb-6">
        <h2 className="text-sm font-medium text-gray-900 mb-3">AI Provider</h2>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant={
                settings.aiProvider === "openrouter" ? "default" : "outline"
              }
              size="sm"
              className="flex-1"
              onClick={() =>
                saveSettings({ ...settings, aiProvider: "openrouter" })
              }
            >
              OpenRouter
            </Button>
            <Button
              variant={settings.aiProvider === "gemini" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() =>
                saveSettings({ ...settings, aiProvider: "gemini" })
              }
            >
              Gemini
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-key" className="text-sm">
              {settings.aiProvider === "openrouter" ? "OpenRouter" : "Gemini"}{" "}
              API Key
            </Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your API key"
              value={
                settings.aiProvider === "openrouter"
                  ? settings.openRouterApiKey || ""
                  : settings.geminiApiKey || ""
              }
              onChange={(e) => {
                const key = e.target.value;
                if (settings.aiProvider === "openrouter") {
                  saveSettings({ ...settings, openRouterApiKey: key });
                } else {
                  saveSettings({ ...settings, geminiApiKey: key });
                }
              }}
            />
          </div>

          <Button
            onClick={testConnection}
            variant="outline"
            size="sm"
            className="w-full"
            disabled={connectionStatus.isLoading}
          >
            {connectionStatus.isLoading ? "Testing..." : "Test Connection"}
          </Button>

          {connectionStatus.message && (
            <Alert>
              <div className="flex items-center gap-2">
                {connectionStatus.isConnected ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <AlertDescription className="text-sm">
                  {connectionStatus.message}
                </AlertDescription>
              </div>
            </Alert>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          AI Tutor Extension v1.0.0
        </p>
      </div>
    </div>
  );
}
