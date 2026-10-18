import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui";
import { ErrorBoundary } from "@/components/layout/error-boundary";
import "./index.css";

const DashboardPage = lazy(() => import("@/pages/dashboard"));
const ProjectsListPage = lazy(() => import("@/pages/projects/list"));
const ProjectDetailPage = lazy(() => import("@/pages/projects/detail"));
const ProjectSetupPage = lazy(() => import("@/pages/projects/setup"));
const PromptsListPage = lazy(() => import("@/pages/prompts/list"));
const PromptDetailPage = lazy(() => import("@/pages/prompts/detail"));
const ScansListPage = lazy(() => import("@/pages/scans/list"));
const ScanDetailPage = lazy(() => import("@/pages/scans/detail"));
const InsightsPage = lazy(() => import("@/pages/insights"));
const ActionsPage = lazy(() => import("@/pages/actions"));
const AlertsPage = lazy(() => import("@/pages/alerts"));
const SettingsPage = lazy(() => import("@/pages/settings"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
    </div>
  );
}

function withPageBoundary(Page: React.ComponentType) {
  return (
    <ErrorBoundary inline>
      <Page />
    </ErrorBoundary>
  );
}

function App() {
  return (
    <ErrorBoundary>
    <TooltipProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={withPageBoundary(DashboardPage)} />
            <Route path="/projects" element={withPageBoundary(ProjectsListPage)} />
            <Route path="/projects/setup" element={withPageBoundary(ProjectSetupPage)} />
            <Route path="/projects/:id" element={withPageBoundary(ProjectDetailPage)} />
            <Route path="/prompts" element={withPageBoundary(PromptsListPage)} />
            <Route path="/prompts/:id" element={withPageBoundary(PromptDetailPage)} />
            <Route path="/scans" element={withPageBoundary(ScansListPage)} />
            <Route path="/scans/:id" element={withPageBoundary(ScanDetailPage)} />
            <Route path="/insights" element={withPageBoundary(InsightsPage)} />
            <Route path="/actions" element={withPageBoundary(ActionsPage)} />
            <Route path="/alerts" element={withPageBoundary(AlertsPage)} />
            <Route path="/settings" element={withPageBoundary(SettingsPage)} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster position="bottom-right" theme="dark" style={{ pointerEvents: "none" }} toastOptions={{ style: { pointerEvents: "auto" } }} />
    </TooltipProvider>
    </ErrorBoundary>
  );
}

export default App;
