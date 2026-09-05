const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

let isGoogleAnalyticsLoaded = false;

export function initializeGoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) {
    return;
  }

  if (isGoogleAnalyticsLoaded) {
    return;
  }

  const existingScript = document.querySelector(
    `script[src="https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"]`
  );

  if (!existingScript) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);
  }

  window.dataLayer = window.dataLayer || [];

  function gtag() {
    window.dataLayer.push(arguments);
  }

  window.gtag = window.gtag || gtag;

  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, {
    send_page_view: false
  });

  isGoogleAnalyticsLoaded = true;
}

export function trackPageView(path) {
  if (!GA_MEASUREMENT_ID || !window.gtag) {
    return;
  }

  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title
  });
}

export function trackEvent(eventName, parameters = {}) {
  if (!GA_MEASUREMENT_ID || !window.gtag) {
    return;
  }

  window.gtag("event", eventName, parameters);
}