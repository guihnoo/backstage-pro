/** Referência ao navigate do React Router — registrada em NavigationSync. */
let appNavigate = null;

export function registerAppNavigate(navigate) {
  appNavigate = navigate ?? null;
}

export function getAppNavigate() {
  return appNavigate;
}
