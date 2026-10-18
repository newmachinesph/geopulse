import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

const WALKTHROUGH_SEEN_KEY = "geopulse-walkthrough-seen";

/** Dashboard tour steps — shown on first visit or when user clicks Help */
const dashboardSteps: DriveStep[] = [
  {
    popover: {
      title: "Welcome to GEOPulse",
      description:
        "GEOPulse monitors how your brand appears in AI-generated answers from ChatGPT, Perplexity, and Google AI. Let's walk through the key features.",
    },
  },
  {
    element: "#sidebar-nav",
    popover: {
      title: "Navigation",
      description:
        "Use the sidebar to navigate between Dashboard, Projects, Prompts, Scans, Insights, Actions, and Alerts.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#nav-projects",
    popover: {
      title: "Projects",
      description:
        "Create and manage your brand monitoring projects here. Each project tracks one brand across AI engines.",
      side: "right",
    },
  },
  {
    element: "#project-selector",
    popover: {
      title: "Project Selector",
      description:
        "Switch between projects. All dashboard data, prompts, and scans are scoped to the selected project.",
      side: "bottom",
    },
  },
  {
    element: "#visibility-score",
    popover: {
      title: "Visibility Score",
      description:
        "Your brand's average AI visibility score (0-5). Higher means your brand is mentioned more prominently in AI responses.",
      side: "bottom",
    },
  },
  {
    element: "#share-of-voice",
    popover: {
      title: "Share of Voice",
      description:
        "How often your brand is mentioned compared to competitors. See competitor mention rates at a glance.",
      side: "bottom",
    },
  },
  {
    element: "#engine-breakdown",
    popover: {
      title: "Engine Breakdown",
      description:
        "Performance comparison across ChatGPT, Perplexity, and Google AI. See which engines mention your brand most.",
      side: "bottom",
    },
  },
  {
    element: "#trend-chart",
    popover: {
      title: "Visibility Trend",
      description:
        "Track how your AI visibility changes over time across all engines. Spot trends and measure the impact of your GEO efforts.",
      side: "top",
    },
  },
  {
    element: "#market-overview",
    popover: {
      title: "Market Overview",
      description:
        "See visibility scores broken down by geographic market (US, UK, etc.).",
      side: "top",
    },
  },
  {
    element: "#recent-scans",
    popover: {
      title: "Recent Scans",
      description:
        "Quick view of your latest scan results. Click through to see full scan details.",
      side: "top",
    },
  },
  {
    element: "#nav-prompts",
    popover: {
      title: "Prompts",
      description:
        "Manage the search prompts used for scanning. Generate prompts with AI or add them manually. These are the queries sent to AI engines.",
      side: "right",
    },
  },
  {
    element: "#nav-scans",
    popover: {
      title: "Scans",
      description:
        "Launch and monitor scans. A scan sends your prompts to AI engines and analyzes the responses for brand mentions, sentiment, and citations.",
      side: "right",
    },
  },
  {
    element: "#nav-insights",
    popover: {
      title: "Insights",
      description:
        "View gap analysis, competitor comparisons, and AI-generated optimization recommendations based on your scan data.",
      side: "right",
    },
  },
  {
    element: "#nav-actions",
    popover: {
      title: "Actions",
      description:
        "Actionable recommendations generated from scan results. Track and dismiss items as you optimize your GEO strategy.",
      side: "right",
    },
  },
  {
    element: "#nav-alerts",
    popover: {
      title: "Alerts",
      description:
        "Get notified about significant changes — visibility drops, new competitor mentions, or scan failures.",
      side: "right",
    },
  },
  {
    element: "#header-alerts",
    popover: {
      title: "Quick Alerts",
      description:
        "The bell icon shows unread alert count. Click to preview recent alerts without leaving your current page.",
      side: "bottom",
    },
  },
  {
    element: "#sidebar-footer",
    popover: {
      title: "Settings & Theme",
      description:
        "Configure your API keys, scan schedules, and preferences. Toggle between light and dark mode with the sun/moon icon.",
      side: "right",
    },
  },
  {
    popover: {
      title: "You're All Set!",
      description:
        "Start by creating a project, adding prompts, and running your first scan. You can replay this tour anytime from the Help button in the sidebar.",
    },
  },
];

export function startWalkthrough() {
  const driverObj = driver({
    showProgress: true,
    animate: true,
    allowClose: true,
    overlayColor: "rgba(0, 0, 0, 0.85)",
    overlayOpacity: 0.85,
    stagePadding: 8,
    stageRadius: 8,
    popoverClass: "geopulse-popover",
    nextBtnText: "Next",
    prevBtnText: "Back",
    doneBtnText: "Done",
    progressText: "{{current}} / {{total}}",
    steps: dashboardSteps,
    onDestroyed: () => {
      localStorage.setItem(WALKTHROUGH_SEEN_KEY, "true");
    },
  });

  driverObj.drive();
}

export function shouldShowWalkthrough(): boolean {
  return localStorage.getItem(WALKTHROUGH_SEEN_KEY) !== "true";
}

export function resetWalkthrough() {
  localStorage.removeItem(WALKTHROUGH_SEEN_KEY);
}
