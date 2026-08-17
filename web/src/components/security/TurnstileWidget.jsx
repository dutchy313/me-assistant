import { useEffect, useRef, useState } from "react";

const TURNSTILE_SCRIPT_ID = "cloudflare-turnstile-script";
const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export default function TurnstileWidget({
  siteKey,
  enabled,
  onVerify,
  onExpire,
  onError
}) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [scriptStatus, setScriptStatus] = useState("idle");

  useEffect(() => {
    if (!enabled) return;

    if (!siteKey) {
      setScriptStatus("missing-site-key");
      return;
    }

    let script = document.getElementById(TURNSTILE_SCRIPT_ID);

    if (script) {
      if (window.turnstile) {
        setScriptStatus("ready");
      } else {
        script.addEventListener("load", handleScriptLoad);
        script.addEventListener("error", handleScriptError);
      }

      return () => {
        script.removeEventListener("load", handleScriptLoad);
        script.removeEventListener("error", handleScriptError);
      };
    }

    script = document.createElement("script");
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;

    script.addEventListener("load", handleScriptLoad);
    script.addEventListener("error", handleScriptError);

    document.body.appendChild(script);

    return () => {
      script.removeEventListener("load", handleScriptLoad);
      script.removeEventListener("error", handleScriptError);
    };

    function handleScriptLoad() {
      setScriptStatus("ready");
    }

    function handleScriptError() {
      setScriptStatus("failed");
      onError?.();
    }
  }, [enabled, siteKey, onError]);

  useEffect(() => {
    if (!enabled || !siteKey || scriptStatus !== "ready") return;
    if (!containerRef.current || !window.turnstile) return;
    if (widgetIdRef.current !== null) return;

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token) => {
        onVerify?.(token);
      },
      "expired-callback": () => {
        onExpire?.();
      },
      "error-callback": () => {
        onError?.();
      }
    });

    return () => {
      if (window.turnstile && widgetIdRef.current !== null) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [enabled, siteKey, scriptStatus, onVerify, onExpire, onError]);

  if (!enabled) {
    return null;
  }

  if (!siteKey) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
        Anti-bot verification is enabled, but the Turnstile site key is missing.
      </div>
    );
  }

  if (scriptStatus === "failed") {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
        Anti-bot verification could not load. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div ref={containerRef} />

      <p className="text-xs leading-5 text-slate-500">
        This verification helps protect M&E Assistant from automated signups.
      </p>
    </div>
  );
}