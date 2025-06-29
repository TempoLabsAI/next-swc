import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      tutorial: {
        start: "Start Tutorial",
        stop: "Stop Tutorial",
        next: "Next",
        previous: "Previous",
        skip: "Skip Tutorial",
        complete: "Complete",
        completed: "Tutorial Complete! 🎉",
        completedDescription: "You've successfully completed the tutorial.",
        close: "Close",
        introduction: {
          title: "Welcome to AI Tutor!",
          description:
            "This interactive tutorial will guide you through the key features of this website.",
          estimatedTime: "Estimated time: {{time}} minutes",
          features: [
            "Step-by-step guidance",
            "AI-powered explanations",
            "Voice narration (optional)",
            "Progress tracking",
          ],
          startButton: "Start Learning",
          skipButton: "Skip for Now",
        },
        progress: {
          step: "Step {{current}} of {{total}}",
          completed: "{{percentage}}% Complete",
        },
      },
      settings: {
        language: "Language",
        voice: "Voice",
        enableVoice: "Enable Voice",
        testVoice: "Test Voice",
        aiProvider: "AI Provider",
        apiKey: "API Key",
        testConnection: "Test Connection",
        autoDetect: "Auto-detect Tutorials",
        showIntroduction: "Show Introduction",
        badgeNotifications: "Badge Notifications",
      },
      messages: {
        connectionSuccess: "Connection successful",
        connectionFailed: "Connection failed",
        noApiKey: "No API key configured",
        testing: "Testing...",
        voiceTest: "This is a voice test for the AI Tutor extension.",
      },
    },
  },
  es: {
    translation: {
      tutorial: {
        start: "Iniciar Tutorial",
        stop: "Detener Tutorial",
        next: "Siguiente",
        previous: "Anterior",
        skip: "Saltar Tutorial",
        complete: "Completar",
        completed: "¡Tutorial Completado! 🎉",
        completedDescription: "Has completado exitosamente el tutorial.",
        close: "Cerrar",
        introduction: {
          title: "¡Bienvenido a AI Tutor!",
          description:
            "Este tutorial interactivo te guiará a través de las características clave de este sitio web.",
          estimatedTime: "Tiempo estimado: {{time}} minutos",
          features: [
            "Guía paso a paso",
            "Explicaciones con IA",
            "Narración por voz (opcional)",
            "Seguimiento del progreso",
          ],
          startButton: "Comenzar a Aprender",
          skipButton: "Saltar por Ahora",
        },
        progress: {
          step: "Paso {{current}} de {{total}}",
          completed: "{{percentage}}% Completado",
        },
      },
      settings: {
        language: "Idioma",
        voice: "Voz",
        enableVoice: "Habilitar Voz",
        testVoice: "Probar Voz",
        aiProvider: "Proveedor de IA",
        apiKey: "Clave API",
        testConnection: "Probar Conexión",
        autoDetect: "Auto-detectar Tutoriales",
        showIntroduction: "Mostrar Introducción",
        badgeNotifications: "Notificaciones de Insignia",
      },
      messages: {
        connectionSuccess: "Conexión exitosa",
        connectionFailed: "Conexión fallida",
        noApiKey: "No hay clave API configurada",
        testing: "Probando...",
        voiceTest: "Esta es una prueba de voz para la extensión AI Tutor.",
      },
    },
  },
  fr: {
    translation: {
      tutorial: {
        start: "Démarrer le Tutoriel",
        stop: "Arrêter le Tutoriel",
        next: "Suivant",
        previous: "Précédent",
        skip: "Ignorer le Tutoriel",
        complete: "Terminer",
        completed: "Tutoriel Terminé ! 🎉",
        completedDescription: "Vous avez terminé le tutoriel avec succès.",
        close: "Fermer",
        introduction: {
          title: "Bienvenue dans AI Tutor !",
          description:
            "Ce tutoriel interactif vous guidera à travers les fonctionnalités clés de ce site web.",
          estimatedTime: "Temps estimé : {{time}} minutes",
          features: [
            "Guide étape par étape",
            "Explications alimentées par IA",
            "Narration vocale (optionnelle)",
            "Suivi des progrès",
          ],
          startButton: "Commencer à Apprendre",
          skipButton: "Ignorer pour Maintenant",
        },
        progress: {
          step: "Étape {{current}} sur {{total}}",
          completed: "{{percentage}}% Terminé",
        },
      },
      settings: {
        language: "Langue",
        voice: "Voix",
        enableVoice: "Activer la Voix",
        testVoice: "Tester la Voix",
        aiProvider: "Fournisseur IA",
        apiKey: "Clé API",
        testConnection: "Tester la Connexion",
        autoDetect: "Détecter Automatiquement les Tutoriels",
        showIntroduction: "Afficher l'Introduction",
        badgeNotifications: "Notifications de Badge",
      },
      messages: {
        connectionSuccess: "Connexion réussie",
        connectionFailed: "Connexion échouée",
        noApiKey: "Aucune clé API configurée",
        testing: "Test en cours...",
        voiceTest: "Ceci est un test vocal pour l'extension AI Tutor.",
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
