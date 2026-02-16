// src/utils/sessionSecurity.js
// Session idle timeout and last-activity tracking for admin security.

const ADMIN_LAST_ACTIVITY_KEY = "bcnl_admin_last_activity";
const ADMIN_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function touchAdminSession() {
  try {
    sessionStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export function getAdminLastActivity() {
  try {
    const raw = sessionStorage.getItem(ADMIN_LAST_ACTIVITY_KEY);
    return raw ? parseInt(raw, 10) : null;
  } catch {
    return null;
  }
}

export function clearAdminSession() {
  try {
    sessionStorage.removeItem(ADMIN_LAST_ACTIVITY_KEY);
  } catch {
    // ignore
  }
}

/**
 * Returns true if admin session has exceeded idle timeout.
 */
export function isAdminSessionExpired() {
  const last = getAdminLastActivity();
  if (last == null) return false; // no session tracked yet
  return Date.now() - last > ADMIN_IDLE_TIMEOUT_MS;
}

export { ADMIN_IDLE_TIMEOUT_MS };
