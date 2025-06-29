import React from "react";
import { useTranslation } from "react-i18next";
import { TutorialState } from "../types";
import { CheckCircle, Circle } from "lucide-react";

interface TutorialProgressProps {
  tutorialState: TutorialState;
  className?: string;
}

export function TutorialProgress({
  tutorialState,
  className = "",
}: TutorialProgressProps) {
  const { t } = useTranslation();

  const progressPercentage =
    tutorialState.totalSteps > 0
      ? Math.round(
          ((tutorialState.currentStep + 1) / tutorialState.totalSteps) * 100,
        )
      : 0;

  return (
    <div className={`ai-tutor-progress ${className}`}>
      <div className="ai-tutor-progress-header">
        <span className="ai-tutor-progress-text">
          {t("tutorial.progress.step", {
            current: tutorialState.currentStep + 1,
            total: tutorialState.totalSteps,
          })}
        </span>
        <span className="ai-tutor-progress-percentage">
          {t("tutorial.progress.completed", { percentage: progressPercentage })}
        </span>
      </div>

      <div className="ai-tutor-progress-bar">
        <div
          className="ai-tutor-progress-fill"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="ai-tutor-progress-steps">
        {Array.from({ length: tutorialState.totalSteps }, (_, index) => {
          const isCompleted = tutorialState.completedSteps.includes(index);
          const isCurrent = index === tutorialState.currentStep;

          return (
            <div
              key={index}
              className={`ai-tutor-progress-step ${
                isCompleted ? "completed" : isCurrent ? "current" : "pending"
              }`}
            >
              {isCompleted ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Circle className="w-4 h-4" />
              )}
              <span className="ai-tutor-progress-step-number">{index + 1}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
