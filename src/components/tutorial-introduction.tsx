import React from "react";
import { useTranslation } from "react-i18next";
import { TutorialIntroduction } from "../types";
import { Play, Clock, CheckCircle, X } from "lucide-react";

interface TutorialIntroductionProps {
  introduction: TutorialIntroduction;
  siteName: string;
  onClose: () => void;
}

export function TutorialIntroductionComponent({
  introduction,
  siteName,
  onClose,
}: TutorialIntroductionProps) {
  const { t } = useTranslation();

  return (
    <div className="ai-tutor-introduction-overlay">
      <div className="ai-tutor-introduction-modal">
        <div className="ai-tutor-introduction-header">
          <div className="ai-tutor-introduction-icon">
            <div className="ai-tutor-logo">
              <Play className="w-6 h-6 text-white" />
            </div>
          </div>
          <button
            className="ai-tutor-introduction-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="ai-tutor-introduction-content">
          <h2 className="ai-tutor-introduction-title">
            {t("tutorial.introduction.title")}
          </h2>

          <p className="ai-tutor-introduction-subtitle">{siteName}</p>

          <p className="ai-tutor-introduction-description">
            {introduction.description}
          </p>

          <div className="ai-tutor-introduction-time">
            <Clock className="w-4 h-4" />
            <span>
              {t("tutorial.introduction.estimatedTime", {
                time: introduction.estimatedTime,
              })}
            </span>
          </div>

          <div className="ai-tutor-introduction-features">
            <h3>{t("tutorial.introduction.features")}</h3>
            <ul>
              {introduction.features.map((feature, index) => (
                <li key={index}>
                  <CheckCircle className="w-4 h-4" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="ai-tutor-introduction-actions">
          <button
            className="ai-tutor-btn ai-tutor-btn-ghost"
            onClick={introduction.onSkip}
          >
            {t("tutorial.introduction.skipButton")}
          </button>
          <button
            className="ai-tutor-btn ai-tutor-btn-primary"
            onClick={introduction.onStart}
          >
            <Play className="w-4 h-4 mr-2" />
            {t("tutorial.introduction.startButton")}
          </button>
        </div>
      </div>
    </div>
  );
}
