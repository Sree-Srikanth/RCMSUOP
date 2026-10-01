// src/app/(other)/apply/useDraftSaver.ts
// Autosave for the application draft.
//  • every edit bumps a version; a debounced save runs `delay` ms after typing stops
//  • saves are serialised (never two requests in flight → no duplicate drafts)
//  • a successful save NEVER reloads the form from the server — the old
//    "save then loadExistingApplication()" pattern overwrote local edits and
//    is why education / referee details appeared "not saving"
//  • when the tab is hidden/closed, a keepalive request flushes pending edits
import { useCallback, useEffect, useRef, useState } from "react";
import { saveDraft, type ApiResult, type SavePayload } from "../../../services/applicationApi";

export type SaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error" | "offline" | "locked";

interface Options {
  getPayload: () => SavePayload;
  onSaved: (res: ApiResult<any>) => void;
  /** Server refused because the vacancy closed or the application was already submitted. */
  onLocked: (res: ApiResult<any>) => void;
  enabled: boolean;
  delay?: number;
}

export const useDraftSaver = ({ getPayload, onSaved, onLocked, enabled, delay = 2000 }: Options) => {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState("");

  const version = useRef(0);
  const savedVersion = useRef(0);
  const chain = useRef<Promise<boolean>>(Promise.resolve(true));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  // Keep latest callbacks without re-creating `flush`.
  const cb = useRef({ getPayload, onSaved, onLocked });
  cb.current = { getPayload, onSaved, onLocked };

  const isDirty = () => version.current !== savedVersion.current;

  const saveOnce = useCallback(async (): Promise<boolean> => {
    if (!enabledRef.current || !isDirty()) return true;
    const v = version.current;
    setStatus("saving");
    const res = await saveDraft(cb.current.getPayload());
    if (res.success) {
      savedVersion.current = Math.max(savedVersion.current, v);
      cb.current.onSaved(res);
      setLastSavedAt(new Date());
      setError("");
      setStatus(isDirty() ? "unsaved" : "saved");
      return true;
    }
    if (res.code === "closed" || res.code === "submitted") {
      savedVersion.current = version.current;
      setStatus("locked");
      setError(res.error || "This application can no longer be edited.");
      cb.current.onLocked(res);
      return false;
    }
    setStatus(res.code === "network" ? "offline" : "error");
    setError(res.error || "Could not save your draft.");
    return false;
  }, []);

  /** Save now (waits for any save already running). Resolves true if everything is saved. */
  const flush = useCallback((): Promise<boolean> => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    chain.current = chain.current.then(saveOnce, saveOnce);
    return chain.current;
  }, [saveOnce]);

  /** Call after every edit. */
  const markDirty = useCallback(() => {
    if (!enabledRef.current) return;
    version.current += 1;
    setStatus((s) => (s === "saving" ? s : "unsaved"));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), delay);
  }, [delay, flush]);

  // Retry automatically when the connection comes back.
  useEffect(() => {
    const online = () => isDirty() && void flush();
    window.addEventListener("online", online);
    return () => window.removeEventListener("online", online);
  }, [flush]);

  // Flush on tab hide / close; warn before leaving with unsaved edits.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden" && enabledRef.current && isDirty()) {
        void saveDraft(cb.current.getPayload(), { keepalive: true });
      }
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (enabledRef.current && isDirty()) {
        void saveDraft(cb.current.getPayload(), { keepalive: true });
        e.preventDefault();
        e.returnValue = "";
      }
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return { status, lastSavedAt, error, markDirty, flush, isDirty };
};
