import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Play, Globe, Volume2, Brain, Download } from "lucide-react";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Tutor Extension
              </h1>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-700"
                >
                  Production-Ready MVP
                </Badge>
                <Badge
                  variant="outline"
                  className="border-purple-200 text-purple-700"
                >
                  v1.0.0
                </Badge>
              </div>
            </div>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Transform any website into an interactive learning experience with
            AI-powered contextual guidance, voice narration, and step-by-step
            tutorials that adapt to your learning style.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Download className="w-5 h-5 mr-2" />
              Install Extension
            </Button>
            <Button variant="outline" size="lg">
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                <Play className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle>Smart Highlighting</CardTitle>
              <CardDescription>
                Automatically detects and highlights interactive elements with
                contextual tooltips
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                <Brain className="w-5 h-5 text-green-600" />
              </div>
              <CardTitle>AI Integration</CardTitle>
              <CardDescription>
                Powered by OpenRouter and Gemini AI for intelligent,
                context-aware guidance
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                <Globe className="w-5 h-5 text-purple-600" />
              </div>
              <CardTitle>Multi-Language</CardTitle>
              <CardDescription>
                Support for 10+ languages with automatic browser language
                detection
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-2">
                <Volume2 className="w-5 h-5 text-orange-600" />
              </div>
              <CardTitle>Voice Synthesis</CardTitle>
              <CardDescription>
                Text-to-speech narration for accessibility and enhanced learning
                experience
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-2">
                <Settings className="w-5 h-5 text-red-600" />
              </div>
              <CardTitle>Easy Configuration</CardTitle>
              <CardDescription>
                Intuitive popup interface and admin panel for managing tutorials
                and settings
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mb-2">
                <Download className="w-5 h-5 text-teal-600" />
              </div>
              <CardTitle>Easy Installation</CardTitle>
              <CardDescription>
                One-click browser extension installer for Chrome and Firefox
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Installation Instructions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>🚀 Installation Instructions</CardTitle>
            <CardDescription>
              Get started with the AI Tutor Extension in minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">1. Build the Extension</h3>
              <code className="bg-gray-800 text-green-400 px-3 py-1 rounded text-sm">
                npm run build:extension
              </code>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">
                2. Package for Distribution
              </h3>
              <code className="bg-gray-800 text-green-400 px-3 py-1 rounded text-sm">
                npm run package:extension
              </code>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">3. Install in Chrome</h3>
              <ul className="text-sm text-gray-600 space-y-1 mt-2">
                <li>
                  • Open Chrome and go to <code>chrome://extensions/</code>
                </li>
                <li>• Enable "Developer mode"</li>
                <li>
                  • Click "Load unpacked" and select the <code>dist</code>{" "}
                  folder
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Tech Stack */}
        <Card>
          <CardHeader>
            <CardTitle>🛠️ Tech Stack</CardTitle>
            <CardDescription>
              Built with modern technologies for optimal performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Frontend</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• React 18 + TypeScript</li>
                  <li>• TailwindCSS + Headless UI</li>
                  <li>• Vite + vite-plugin-web-extension</li>
                  <li>• Zustand for state management</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Features</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• OpenRouter & Gemini AI integration</li>
                  <li>• Browser speechSynthesis API</li>
                  <li>• IndexedDB + localStorage</li>
                  <li>• i18next for internationalization</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
