const isTauri = () => {
  return (
    typeof window !== "undefined" &&
    (window as any).__TAURI_INTERNALS__ !== undefined
  );
};

const getInvoke = async () => {
  if (!isTauri()) {
    throw new Error("Not running in Tauri environment");
  }
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke;
};

// Projects
export async function getProjects() {
  const invoke = await getInvoke();
  return invoke<import("@/lib/types").Project[]>("get_all_projects");
}

export async function getProject(id: string) {
  const invoke = await getInvoke();
  return invoke<import("@/lib/types").Project | null>("get_project", { id });
}

export async function createProject(
  input: import("@/lib/types").CreateProjectInput
) {
  const invoke = await getInvoke();
  return invoke<import("@/lib/types").Project>("create_project", { input });
}

export async function updateProject(
  id: string,
  input: import("@/lib/types").UpdateProjectInput
) {
  const invoke = await getInvoke();
  return invoke<import("@/lib/types").Project | null>("update_project", {
    id,
    input,
  });
}

export async function deleteProject(id: string) {
  const invoke = await getInvoke();
  return invoke<boolean>("delete_project", { id });
}

// Prompts
export async function getPrompts(projectId: string) {
  const invoke = await getInvoke();
  return invoke<import("@/lib/types").Prompt[]>("get_prompts", { projectId });
}

export async function createPrompt(
  input: import("@/lib/types").CreatePromptInput
) {
  const invoke = await getInvoke();
  return invoke<import("@/lib/types").Prompt>("create_prompt", { input });
}

export async function deletePrompt(id: string) {
  const invoke = await getInvoke();
  return invoke<boolean>("delete_prompt", { id });
}

// Scans
export async function getScans(projectId: string) {
  const invoke = await getInvoke();
  return invoke<import("@/lib/types").Scan[]>("get_scans", { projectId });
}

export async function startScan(projectId: string, config: string) {
  const invoke = await getInvoke();
  return invoke<import("@/lib/types").Scan>("start_scan", {
    projectId,
    config,
  });
}

export async function cancelScan(id: string) {
  const invoke = await getInvoke();
  return invoke<boolean>("cancel_scan", { id });
}

export async function compareScans(beforeScanId: string, afterScanId: string) {
  const invoke = await getInvoke();
  return invoke<import("@/lib/types").ScanComparison>("compare_scans", {
    beforeScanId,
    afterScanId,
  });
}

// Results
export async function getScanResults(scanId: string) {
  const invoke = await getInvoke();
  return invoke<import("@/lib/types").ParsedResult[]>("get_scan_results", {
    scanId,
  });
}

export async function getRawResponse(id: string) {
  const invoke = await getInvoke();
  return invoke<import("@/lib/types").RawResponse | null>("get_raw_response", {
    id,
  });
}

export async function getCitations(parsedResultId: string) {
  const invoke = await getInvoke();
  return invoke<import("@/lib/types").Citation[]>("get_citations", {
    parsedResultId,
  });
}

// Visibility
export async function getVisibilityScores(projectId: string) {
  const invoke = await getInvoke();
  return invoke<import("@/lib/types").VisibilityScoreAggregate[]>(
    "get_visibility_scores",
    { projectId }
  );
}

// Actions
export async function getActions(projectId: string) {
  const invoke = await getInvoke();
  return invoke<import("@/lib/types").ActionItem[]>("get_actions", {
    projectId,
  });
}

export async function updateAction(id: string, status: string) {
  const invoke = await getInvoke();
  return invoke<import("@/lib/types").ActionItem | null>("update_action", {
    id,
    status,
  });
}

export async function dismissAction(id: string) {
  const invoke = await getInvoke();
  return invoke<boolean>("dismiss_action", { id });
}

// Alerts
export async function getAlerts(projectId: string) {
  const invoke = await getInvoke();
  return invoke<import("@/lib/types").Alert[]>("get_alerts", { projectId });
}

export async function getUnreadAlerts(projectId: string) {
  const invoke = await getInvoke();
  return invoke<import("@/lib/types").Alert[]>("get_unread_alerts", { projectId });
}

export async function markAlertRead(id: string) {
  const invoke = await getInvoke();
  return invoke<boolean>("mark_alert_read", { id });
}

export async function markAllAlertsRead(projectId: string) {
  const invoke = await getInvoke();
  return invoke<void>("mark_all_alerts_read", { projectId });
}

// Settings
export async function getSettings() {
  const invoke = await getInvoke();
  return invoke<string>("get_settings");
}

export async function updateSettings(settings: string) {
  const invoke = await getInvoke();
  return invoke<void>("update_settings", { settings });
}
