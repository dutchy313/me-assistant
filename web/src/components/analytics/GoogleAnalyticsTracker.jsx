import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  initializeGoogleAnalytics,
  trackPageView
} from "../../lib/analytics";

export default function GoogleAnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    initializeGoogleAnalytics();
  }, []);

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    trackPageView(path);
  }, [location.pathname, location.search]);

  return null;
}