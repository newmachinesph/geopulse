export function isTauri(): boolean {
  return (
    typeof window !== "undefined" &&
    (window as any).__TAURI_INTERNALS__ !== undefined
  );
}

export async function getInvoke() {
  if (!isTauri()) {
    throw new Error("Not running in Tauri environment");
  }
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke;
}
