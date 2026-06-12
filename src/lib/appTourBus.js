let startHandler = null;

export function registerTourStarter(fn) {
  startHandler = fn;
}

export function unregisterTourStarter() {
  startHandler = null;
}

export function requestAppTour() {
  startHandler?.();
}

export const APP_TOUR_START_EVENT = 'backstage:start-tour';
