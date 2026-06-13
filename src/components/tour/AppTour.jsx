import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import './appTour.css';
import { useAuth } from '@/lib/authContext';
import { buildAppTourSteps, buildMapTourSteps } from '@/lib/appTourSteps';
import {
  registerTourStarter,
  unregisterTourStarter,
  APP_TOUR_START_EVENT,
} from '@/lib/appTourBus';

const AUTO_START_DELAY_MS = 900;

function elementReady(selector) {
  if (!selector) return true;
  return Boolean(document.querySelector(selector));
}

function filterReadySteps(steps) {
  return steps.filter((step) => {
    if (!step.element) return true;
    return elementReady(step.element);
  });
}

export default function AppTour() {
  const { profile, isOnboardingComplete, updateProfile } = useAuth();
  const { pathname } = useLocation();
  const driverRef = useRef(null);
  const completingRef = useRef(false);
  const autoStartedRef = useRef(false);

  const markTourComplete = useCallback(async () => {
    if (completingRef.current || profile?.tour_completed_at) return;
    completingRef.current = true;
    try {
      await updateProfile({ tour_completed_at: new Date().toISOString() });
    } catch (err) {
      console.error('[AppTour] markTourComplete', err);
    } finally {
      completingRef.current = false;
    }
  }, [profile?.tour_completed_at, updateProfile]);

  const startTour = useCallback(
    ({ persist = true, variant = 'full' } = {}) => {
      driverRef.current?.destroy();

      const steps = filterReadySteps(
        variant === 'map' ? buildMapTourSteps() : buildAppTourSteps({ pathname })
      );
      if (steps.length === 0) return;

      const driverObj = driver({
        showProgress: true,
        animate: true,
        smoothScroll: true,
        allowClose: true,
        overlayOpacity: 0.72,
        stagePadding: 8,
        stageRadius: 12,
        popoverClass: 'backstage-tour-popover',
        nextBtnText: 'Próximo',
        prevBtnText: 'Voltar',
        doneBtnText: 'Começar',
        progressText: '{{current}} / {{total}}',
        steps,
        onDestroyed: () => {
          driverRef.current = null;
          if (persist) {
            markTourComplete();
          }
        },
      });

      driverRef.current = driverObj;
      driverObj.drive();
    },
    [markTourComplete, pathname]
  );

  useEffect(() => {
    registerTourStarter((options = {}) => startTour({ persist: false, ...options }));
    return () => {
      unregisterTourStarter();
      driverRef.current?.destroy();
    };
  }, [startTour]);

  useEffect(() => {
    const onManualStart = (event) => {
      const variant = event?.detail?.variant === 'map' ? 'map' : 'full';
      startTour({ persist: false, variant });
    };
    window.addEventListener(APP_TOUR_START_EVENT, onManualStart);
    return () => window.removeEventListener(APP_TOUR_START_EVENT, onManualStart);
  }, [startTour]);

  useEffect(() => {
    if (pathname !== '/') return;
    if (!isOnboardingComplete) return;
    if (profile?.tour_completed_at) return;
    if (autoStartedRef.current) return;

    autoStartedRef.current = true;
    const timer = window.setTimeout(() => {
      startTour({ persist: true });
    }, AUTO_START_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [pathname, isOnboardingComplete, profile?.tour_completed_at, startTour]);

  return null;
}
