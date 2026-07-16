import { Platform } from "react-native";
import { PREMIUM_ENTITLEMENT_ID } from "@calm-stories/shared";

// Physical devices use LAN IP, web/simulators use localhost
// Update this IP to match your computer's local network address (ipconfig)
const LOCAL_API =
  Platform.OS === "web" ? "http://localhost:3000" : "http://192.168.1.46:3000";


export const CONFIG = {
  API_URL: __DEV__ ? LOCAL_API : "https://your-production-url.vercel.app",
  STORAGE_KEYS: {
    AUTH_TOKEN: "calm_auth_token",
    USER_DATA: "calm_user_data",
    APP_MODE: "calm_app_mode",
  },
  REVENUECAT: {
    // Test Store key — swap for the platform keys (appl_… / goog_…) before
    // shipping. SDK API keys are publishable, not secrets.
    API_KEY: "test_frcoeUgNpVIEJYQaVDGJBtOtXft",
    ENTITLEMENT_ID: PREMIUM_ENTITLEMENT_ID,
    // Offering/package identifiers as configured in the RevenueCat dashboard
    OFFERING_ID: "default",
    MONTHLY_PACKAGE_ID: "monthly",
  },
} as const;
