"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Workspace } from "@/lib/workspace/types";

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readOnly, setReadOnly] = useState(false);

  const refresh = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/workspace", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load workspace");
      setReadOnly(res.headers.get("x-workspace-readonly") === "1");
      const ws = (await res.json()) as Workspace;
      setWorkspace(ws);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(async (next: Workspace): Promise<boolean> => {
    setError(null);
    if (readOnly) {
      setError("Read-only on deployed site");
      return false;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error("Failed to save workspace");
      setWorkspace(next);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
      return false;
    } finally {
      setSaving(false);
    }
  }, [readOnly]);

  return useMemo(
    () => ({ workspace, setWorkspace, refresh, save, loading, saving, error, readOnly }),
    [workspace, refresh, save, loading, saving, error, readOnly],
  );
}

