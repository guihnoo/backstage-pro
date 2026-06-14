let startHandler = null;

export function registerTourStarter(fn) {
  startHandler = fn;
}

export function unregisterTourStarter() {
  startHandler = null;
}

export function requestAppTour({ variant = 'full' } = {}) {
  if (startHandler) {
    startHandler({ variant });
    return;
  }
  window.dispatchEvent(new CustomEvent(APP_TOUR_START_EVENT, { detail: { variant } }));
}

export function requestMapTour() {
  requestAppTour({ variant: 'map' });
}

export const APP_TOUR_START_EVENT = 'backstage:start-tour';
