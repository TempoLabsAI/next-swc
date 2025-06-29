import { SiteDetectionRule } from "../types";

export class SiteDetectionService {
  private rules: SiteDetectionRule[] = [
    {
      id: "github",
      domain: "github.com",
      selectors: [
        'button[data-testid="create-repository-button"]',
        ".js-new-repository-button",
        '[data-testid="new-repo-button"]',
        ".repository-content",
        ".file-navigation",
      ],
      name: "GitHub",
      description: "Learn GitHub repository management and navigation",
      priority: 1,
    },
    {
      id: "gmail",
      domain: "mail.google.com",
      selectors: [
        '[data-tooltip="Compose"]',
        ".T-I.T-I-KE.L3",
        '[role="button"][data-tooltip="Compose"]',
        ".nH .nH .nH",
        ".aeN",
      ],
      name: "Gmail",
      description: "Master Gmail interface and email management",
      priority: 1,
    },
    {
      id: "google-docs",
      domain: "docs.google.com",
      selectors: [
        ".docs-titlebar-badge",
        ".docs-material .docs-titlebar",
        '[data-tooltip="Bold (Ctrl+B)"]',
        ".docs-toolbar",
        ".kix-page",
      ],
      name: "Google Docs",
      description: "Learn document editing and collaboration features",
      priority: 1,
    },
    {
      id: "linkedin",
      domain: "linkedin.com",
      selectors: [
        '[data-test-id="compose-button"]',
        ".share-box-feed-entry__trigger",
        ".feed-shared-update-v2",
        ".global-nav",
        ".scaffold-layout__main",
      ],
      name: "LinkedIn",
      description: "Navigate professional networking features",
      priority: 1,
    },
    {
      id: "youtube",
      domain: "youtube.com",
      selectors: [
        "#create-icon",
        ".ytd-masthead #avatar-btn",
        ".ytd-video-primary-info-renderer",
        "#subscribe-button",
        ".ytd-watch-flexy",
      ],
      name: "YouTube",
      description: "Discover video platform features and controls",
      priority: 1,
    },
    {
      id: "generic-ecommerce",
      domain: "*",
      selectors: [
        '[data-testid="add-to-cart"]',
        ".add-to-cart",
        ".btn-add-to-cart",
        ".product-form__cart",
        ".shopping-cart",
      ],
      name: "E-commerce",
      description: "Learn online shopping interface basics",
      priority: 2,
    },
    {
      id: "generic-form",
      domain: "*",
      selectors: [
        'form[role="search"]',
        ".search-form",
        'input[type="search"]',
        ".contact-form",
        ".newsletter-form",
      ],
      name: "Web Forms",
      description: "Master form filling and submission",
      priority: 3,
    },
  ];

  detectCompatibleSite(): SiteDetectionRule | null {
    const currentDomain = window.location.hostname;

    // First, try exact domain matches
    for (const rule of this.rules) {
      if (rule.domain !== "*" && currentDomain.includes(rule.domain)) {
        if (this.hasMatchingElements(rule.selectors)) {
          return rule;
        }
      }
    }

    // Then try generic rules
    const genericRules = this.rules.filter((rule) => rule.domain === "*");
    for (const rule of genericRules.sort((a, b) => a.priority - b.priority)) {
      if (this.hasMatchingElements(rule.selectors)) {
        return rule;
      }
    }

    return null;
  }

  private hasMatchingElements(selectors: string[]): boolean {
    let matchCount = 0;
    const requiredMatches = Math.max(1, Math.floor(selectors.length * 0.3)); // At least 30% of selectors should match

    for (const selector of selectors) {
      try {
        if (document.querySelector(selector)) {
          matchCount++;
          if (matchCount >= requiredMatches) {
            return true;
          }
        }
      } catch (error) {
        // Invalid selector, skip
        continue;
      }
    }

    return false;
  }

  getSiteId(): string {
    const rule = this.detectCompatibleSite();
    if (rule) {
      return rule.id;
    }

    // Fallback to domain-based ID
    const domain = window.location.hostname.replace(/^www\./, "");
    return domain.replace(/\./g, "-");
  }

  getSiteName(): string {
    const rule = this.detectCompatibleSite();
    if (rule) {
      return rule.name;
    }

    // Fallback to domain name
    const domain = window.location.hostname.replace(/^www\./, "");
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  }

  getSiteDescription(): string {
    const rule = this.detectCompatibleSite();
    if (rule) {
      return rule.description;
    }

    return "Learn the key features and navigation of this website";
  }

  isCompatibleSite(): boolean {
    return this.detectCompatibleSite() !== null;
  }
}

export const siteDetectionService = new SiteDetectionService();
