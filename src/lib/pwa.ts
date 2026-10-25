// Single guarded service-worker registration wrapper.
function isRefusedContext() {
  if (!import.meta.env.PROD) return true;
  if (window.self !== window.top) return true;
  const h = window.location.hostname.toLowerCase();
  const label = h.split(".")[0];
  const lovableHost = /\.(lovable\.app|gpt-eng\.com|gptengineer\.run)$/.test(h);
  if (lovableHost && /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/.test(label)) return true;
  if (lovableHost && /^project--.+-dev$/.test(label)) return true;
  if (h === "lovableproject.com" || h.endsWith(".lovableproject.com")) return true;
  if (h === "lovableproject-dev.com" || h.endsWith(".lovableproject-dev.com")) return true;
  if (h === "beta.lovable.dev" || h.endsWith(".beta.lovable.dev")) return true;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

export async function registerFirstNoteSW() {
  if (!("serviceWorker" in navigator)) return;
  if (isRefusedContext()) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.filter((r) => r.active?.scriptURL.endsWith("/sw.js")).map((r) => r.unregister()));
    return;
  }
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
