import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { TutorialStep, ExtensionSettings } from "../types";
import { Plus, Edit, Trash2, Save, Settings } from "lucide-react";

interface CustomTutorialStep extends TutorialStep {
  isCustom: boolean;
}

export function OptionsApp() {
  const [settings, setSettings] = useState<ExtensionSettings>({
    language: "en",
    voiceEnabled: false,
    aiProvider: "openrouter",
  });

  const [customSteps, setCustomSteps] = useState<CustomTutorialStep[]>([]);
  const [editingStep, setEditingStep] = useState<CustomTutorialStep | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [stepForm, setStepForm] = useState({
    id: "",
    selector: "",
    title: "",
    description: "",
    position: "bottom" as const,
    language: "en",
  });

  useEffect(() => {
    loadSettings();
    loadCustomSteps();
  }, []);

  const loadSettings = async () => {
    chrome.storage.local.get("extensionSettings", (result) => {
      if (result.extensionSettings) {
        setSettings(result.extensionSettings);
      }
    });
  };

  const loadCustomSteps = async () => {
    chrome.storage.local.get("customTutorialSteps", (result) => {
      if (result.customTutorialSteps) {
        setCustomSteps(result.customTutorialSteps);
      }
    });
  };

  const saveSettings = async (newSettings: ExtensionSettings) => {
    setSettings(newSettings);
    chrome.storage.local.set({ extensionSettings: newSettings });
  };

  const saveCustomSteps = async (steps: CustomTutorialStep[]) => {
    setCustomSteps(steps);
    chrome.storage.local.set({ customTutorialSteps: steps });
  };

  const openStepDialog = (step?: CustomTutorialStep) => {
    if (step) {
      setEditingStep(step);
      setStepForm({
        id: step.id,
        selector: step.selector,
        title: step.title,
        description: step.description,
        position: step.position,
        language: step.language,
      });
    } else {
      setEditingStep(null);
      setStepForm({
        id: "",
        selector: "",
        title: "",
        description: "",
        position: "bottom",
        language: settings.language,
      });
    }
    setIsDialogOpen(true);
  };

  const saveStep = () => {
    const newStep: CustomTutorialStep = {
      ...stepForm,
      id: stepForm.id || `custom-${Date.now()}`,
      isCustom: true,
    };

    let updatedSteps;
    if (editingStep) {
      updatedSteps = customSteps.map((step) =>
        step.id === editingStep.id ? newStep : step,
      );
    } else {
      updatedSteps = [...customSteps, newStep];
    }

    saveCustomSteps(updatedSteps);
    setIsDialogOpen(false);
    setEditingStep(null);
  };

  const deleteStep = (stepId: string) => {
    const updatedSteps = customSteps.filter((step) => step.id !== stepId);
    saveCustomSteps(updatedSteps);
  };

  const exportSettings = () => {
    const exportData = {
      settings,
      customSteps,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-tutor-settings.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);

        if (importData.settings) {
          saveSettings(importData.settings);
        }

        if (importData.customSteps) {
          saveCustomSteps(importData.customSteps);
        }

        alert("Settings imported successfully!");
      } catch (error) {
        alert("Error importing settings. Please check the file format.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Tutor Options</h1>
          <p className="text-gray-600">
            Manage your tutorial settings and custom steps
          </p>
        </div>
      </div>

      {/* Settings Section */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          General Settings
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="default-language" className="text-sm font-medium">
              Default Language
            </Label>
            <select
              id="default-language"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={settings.language}
              onChange={(e) =>
                saveSettings({ ...settings, language: e.target.value })
              }
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="it">Italiano</option>
              <option value="pt">Português</option>
              <option value="ru">Русский</option>
              <option value="ja">日本語</option>
              <option value="ko">한국어</option>
              <option value="zh">中文</option>
            </select>
          </div>

          <div>
            <Label htmlFor="ai-provider" className="text-sm font-medium">
              AI Provider
            </Label>
            <select
              id="ai-provider"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={settings.aiProvider}
              onChange={(e) =>
                saveSettings({
                  ...settings,
                  aiProvider: e.target.value as "openrouter" | "gemini",
                })
              }
            >
              <option value="openrouter">OpenRouter</option>
              <option value="gemini">Google Gemini</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="voice-default" className="text-sm font-medium">
                Enable Voice by Default
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                New tutorials will start with voice enabled
              </p>
            </div>
            <Switch
              id="voice-default"
              checked={settings.voiceEnabled}
              onCheckedChange={(checked) =>
                saveSettings({ ...settings, voiceEnabled: checked })
              }
            />
          </div>
        </div>
      </div>

      {/* Custom Tutorial Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Custom Tutorial Steps
          </h2>
          <Button onClick={() => openStepDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Step
          </Button>
        </div>

        {customSteps.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Selector</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customSteps.map((step) => (
                  <TableRow key={step.id}>
                    <TableCell className="font-medium">{step.title}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {step.selector}
                    </TableCell>
                    <TableCell>{step.language}</TableCell>
                    <TableCell>{step.position}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openStepDialog(step)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteStep(step.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">
              No custom tutorial steps created yet.
            </p>
            <Button onClick={() => openStepDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Step
            </Button>
          </div>
        )}
      </div>

      {/* Import/Export */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Backup & Restore
        </h2>

        <div className="flex gap-4">
          <Button onClick={exportSettings} variant="outline">
            Export Settings
          </Button>

          <div>
            <input
              type="file"
              accept=".json"
              onChange={importSettings}
              className="hidden"
              id="import-file"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById("import-file")?.click()}
            >
              Import Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Step Editor Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingStep ? "Edit Tutorial Step" : "Create Tutorial Step"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="step-title">Title</Label>
                <Input
                  id="step-title"
                  value={stepForm.title}
                  onChange={(e) =>
                    setStepForm({ ...stepForm, title: e.target.value })
                  }
                  placeholder="Step title"
                />
              </div>

              <div>
                <Label htmlFor="step-selector">CSS Selector</Label>
                <Input
                  id="step-selector"
                  value={stepForm.selector}
                  onChange={(e) =>
                    setStepForm({ ...stepForm, selector: e.target.value })
                  }
                  placeholder="#button-id or .class-name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="step-description">Description</Label>
              <Textarea
                id="step-description"
                value={stepForm.description}
                onChange={(e) =>
                  setStepForm({ ...stepForm, description: e.target.value })
                }
                placeholder="Describe what the user should do with this element"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="step-position">Tooltip Position</Label>
                <select
                  id="step-position"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={stepForm.position}
                  onChange={(e) =>
                    setStepForm({
                      ...stepForm,
                      position: e.target.value as any,
                    })
                  }
                >
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>

              <div>
                <Label htmlFor="step-language">Language</Label>
                <select
                  id="step-language"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={stepForm.language}
                  onChange={(e) =>
                    setStepForm({ ...stepForm, language: e.target.value })
                  }
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="it">Italiano</option>
                  <option value="pt">Português</option>
                  <option value="ru">Русский</option>
                  <option value="ja">日本語</option>
                  <option value="ko">한국어</option>
                  <option value="zh">中文</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveStep}>
                <Save className="w-4 h-4 mr-2" />
                Save Step
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
