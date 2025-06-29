interface TooltipOptions {
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
  onNext?: () => void;
  onPrevious?: () => void;
  onSkip?: () => void;
  showPrevious?: boolean;
  showNext?: boolean;
  stepNumber?: number;
  totalSteps?: number;
}

interface HighlightStyle {
  borderColor: string;
  backgroundColor: string;
  shadowColor: string;
  animation: string;
}

export class HighlightManager {
  private activeHighlights: Set<HTMLElement> = new Set();
  private tooltipContainer: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  private currentElement: HTMLElement | null = null;
  private currentTooltip: HTMLElement | null = null;

  constructor() {
    this.createTooltipContainer();
    this.setupObservers();
    this.injectStyles();
  }

  private injectStyles() {
    if (document.getElementById("ai-tutor-highlight-styles")) return;

    const style = document.createElement("style");
    style.id = "ai-tutor-highlight-styles";
    style.textContent = `
      @keyframes ai-tutor-pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7), 0 0 0 9999px rgba(0, 0, 0, 0.5);
        }
        70% {
          box-shadow: 0 0 0 10px rgba(59, 130, 246, 0), 0 0 0 9999px rgba(0, 0, 0, 0.5);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0), 0 0 0 9999px rgba(0, 0, 0, 0.5);
        }
      }
      
      @keyframes ai-tutor-glow {
        0%, 100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.5); }
        50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8), 0 0 0 9999px rgba(0, 0, 0, 0.5); }
      }
      
      .ai-tutor-highlight {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border-radius: 8px;
      }
      
      .ai-tutor-highlight.pulse {
        animation: ai-tutor-pulse 2s infinite;
      }
      
      .ai-tutor-highlight.glow {
        animation: ai-tutor-glow 1.5s infinite;
      }
    `;
    document.head.appendChild(style);
  }

  private setupObservers() {
    // Resize observer to update highlight position
    this.resizeObserver = new ResizeObserver(() => {
      if (this.currentElement) {
        this.updateHighlightPosition(this.currentElement);
      }
    });

    // Mutation observer to handle DOM changes
    this.mutationObserver = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      mutations.forEach((mutation) => {
        if (mutation.type === "childList" || mutation.type === "attributes") {
          shouldUpdate = true;
        }
      });

      if (shouldUpdate && this.currentElement) {
        setTimeout(
          () => this.updateHighlightPosition(this.currentElement!),
          100,
        );
      }
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });
  }

  private createTooltipContainer() {
    this.tooltipContainer = document.createElement("div");
    this.tooltipContainer.id = "ai-tutor-tooltip-container";
    this.tooltipContainer.className = "ai-tutor-tooltip-container";
    document.body.appendChild(this.tooltipContainer);
  }

  highlightElement(element: HTMLElement, options: TooltipOptions) {
    this.clearAllHighlights();
    this.currentElement = element;

    // Ensure element is visible
    this.ensureElementVisible(element);

    // Add highlight overlay with enhanced styling
    const highlight = this.createHighlight(
      element,
      this.getHighlightStyle(options),
    );
    this.activeHighlights.add(highlight);

    // Show tooltip with improved positioning
    this.showTooltip(element, options);

    // Start observing the element for changes
    if (this.resizeObserver) {
      this.resizeObserver.observe(element);
    }

    // Scroll element into view with better positioning
    this.scrollToElement(element);
  }

  private ensureElementVisible(element: HTMLElement) {
    // Check if element is hidden and try to make it visible
    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") {
      console.warn("Target element is hidden, tutorial may not work correctly");
    }
  }

  private scrollToElement(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    const isInViewport =
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth;

    if (!isInViewport) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
  }

  private getHighlightStyle(options: TooltipOptions): HighlightStyle {
    return {
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      shadowColor: "rgba(0, 0, 0, 0.5)",
      animation: "pulse",
    };
  }

  private createHighlight(
    element: HTMLElement,
    style: HighlightStyle,
  ): HTMLElement {
    const highlight = document.createElement("div");
    highlight.className = `ai-tutor-highlight ${style.animation}`;
    highlight.setAttribute("data-ai-tutor-highlight", "true");

    this.updateHighlightPosition(element, highlight, style);
    document.body.appendChild(highlight);
    return highlight;
  }

  private updateHighlightPosition(
    element: HTMLElement,
    highlight?: HTMLElement,
    style?: HighlightStyle,
  ) {
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft =
      window.pageXOffset || document.documentElement.scrollLeft;

    const targetHighlight =
      highlight || this.activeHighlights.values().next().value;
    if (!targetHighlight) return;

    const currentStyle = style || {
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      shadowColor: "rgba(0, 0, 0, 0.5)",
      animation: "pulse",
    };

    targetHighlight.style.cssText = `
      position: absolute;
      top: ${rect.top + scrollTop - 4}px;
      left: ${rect.left + scrollLeft - 4}px;
      width: ${rect.width + 8}px;
      height: ${rect.height + 8}px;
      border: 2px solid ${currentStyle.borderColor};
      border-radius: 8px;
      background: ${currentStyle.backgroundColor};
      pointer-events: none;
      z-index: 9998;
      box-shadow: 0 0 0 9999px ${currentStyle.shadowColor};
    `;
  }

  private showTooltip(element: HTMLElement, options: TooltipOptions) {
    if (!this.tooltipContainer) return;

    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft =
      window.pageXOffset || document.documentElement.scrollLeft;

    const tooltip = document.createElement("div");
    tooltip.className = "ai-tutor-tooltip";

    const navigationButtons = this.createNavigationButtons(options);

    tooltip.innerHTML = `
      <div class="ai-tutor-tooltip-content">
        <div class="ai-tutor-tooltip-header">
          <h3 class="ai-tutor-tooltip-title">${options.title}</h3>
          <button class="ai-tutor-tooltip-close" onclick="this.closest('.ai-tutor-tooltip').remove()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="ai-tutor-tooltip-body">
          <p class="ai-tutor-tooltip-description">${options.description}</p>
        </div>
        <div class="ai-tutor-tooltip-footer">
          ${navigationButtons}
        </div>
      </div>
      <div class="ai-tutor-tooltip-arrow ai-tutor-tooltip-arrow-${options.position}"></div>
    `;

    // Position tooltip
    const tooltipRect = this.calculateTooltipPosition(rect, options.position);
    tooltip.style.cssText = `
      position: absolute;
      top: ${tooltipRect.top + scrollTop}px;
      left: ${tooltipRect.left + scrollLeft}px;
      z-index: 9999;
    `;

    // Add event listeners
    this.addTooltipEventListeners(tooltip, options);

    this.tooltipContainer.innerHTML = "";
    this.tooltipContainer.appendChild(tooltip);
  }

  private createNavigationButtons(options: TooltipOptions): string {
    const buttons = [];

    // Import i18n for translations
    const t = (key: string) => {
      // Simple fallback translation function
      const translations: Record<string, string> = {
        "tutorial.previous": "Previous",
        "tutorial.next": "Next",
        "tutorial.skip": "Skip Tutorial",
        "tutorial.complete": "Complete",
      };
      return translations[key] || key;
    };

    if (options.showPrevious && options.onPrevious) {
      buttons.push(
        `<button class="ai-tutor-btn ai-tutor-btn-secondary" data-action="previous">${t("tutorial.previous")}</button>`,
      );
    }

    buttons.push(
      `<button class="ai-tutor-btn ai-tutor-btn-ghost" data-action="skip">${t("tutorial.skip")}</button>`,
    );

    if (options.showNext && options.onNext) {
      buttons.push(
        `<button class="ai-tutor-btn ai-tutor-btn-primary" data-action="next">${t("tutorial.next")}</button>`,
      );
    } else if (options.onNext) {
      buttons.push(
        `<button class="ai-tutor-btn ai-tutor-btn-primary" data-action="next">${t("tutorial.complete")}</button>`,
      );
    }

    return buttons.join("");
  }

  private addTooltipEventListeners(
    tooltip: HTMLElement,
    options: TooltipOptions,
  ) {
    tooltip.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const action = target.getAttribute("data-action");

      switch (action) {
        case "next":
          options.onNext?.();
          break;
        case "previous":
          options.onPrevious?.();
          break;
        case "skip":
          options.onSkip?.();
          break;
      }
    });
  }

  private calculateTooltipPosition(elementRect: DOMRect, position: string) {
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const offset = 12;

    let top = 0;
    let left = 0;

    switch (position) {
      case "top":
        top = elementRect.top - tooltipHeight - offset;
        left = elementRect.left + (elementRect.width - tooltipWidth) / 2;
        break;
      case "bottom":
        top = elementRect.bottom + offset;
        left = elementRect.left + (elementRect.width - tooltipWidth) / 2;
        break;
      case "left":
        top = elementRect.top + (elementRect.height - tooltipHeight) / 2;
        left = elementRect.left - tooltipWidth - offset;
        break;
      case "right":
        top = elementRect.top + (elementRect.height - tooltipHeight) / 2;
        left = elementRect.right + offset;
        break;
    }

    // Keep tooltip within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < 10) left = 10;
    if (left + tooltipWidth > viewportWidth - 10)
      left = viewportWidth - tooltipWidth - 10;
    if (top < 10) top = 10;
    if (top + tooltipHeight > viewportHeight - 10)
      top = viewportHeight - tooltipHeight - 10;

    return { top, left };
  }

  clearAllHighlights() {
    // Clear highlights
    this.activeHighlights.forEach((highlight) => {
      if (highlight.parentElement) {
        highlight.remove();
      }
    });
    this.activeHighlights.clear();

    // Clear tooltip
    if (this.tooltipContainer) {
      this.tooltipContainer.innerHTML = "";
    }
    this.currentTooltip = null;

    // Stop observing current element
    if (this.resizeObserver && this.currentElement) {
      this.resizeObserver.unobserve(this.currentElement);
    }
    this.currentElement = null;
  }

  destroy() {
    this.clearAllHighlights();

    // Clean up observers
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    // Remove tooltip container
    if (this.tooltipContainer && this.tooltipContainer.parentElement) {
      this.tooltipContainer.remove();
    }

    // Remove injected styles
    const styleElement = document.getElementById("ai-tutor-highlight-styles");
    if (styleElement) {
      styleElement.remove();
    }
  }
}
