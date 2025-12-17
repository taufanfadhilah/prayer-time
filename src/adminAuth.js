const ADMIN_AUTH_KEY = "adminAuthed";

export const ADMIN_USERNAME = "admin";
export const ADMIN_PASSWORD = "bismillah";

export function isAdminAuthed() {
  try {
    return sessionStorage.getItem(ADMIN_AUTH_KEY) === "true";
  } catch {
    return false;
  }
}

export function loginAdmin(username, password) {
  const ok = String(username) === ADMIN_USERNAME && String(password) === ADMIN_PASSWORD;
  if (!ok) return false;
  try {
    sessionStorage.setItem(ADMIN_AUTH_KEY, "true");
  } catch {
    // ignore
  }
  return true;
}

export function logoutAdmin() {
  try {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
  } catch {
    // ignore
  }
}


