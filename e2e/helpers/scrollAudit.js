/**
 * Auditoria de scroll/overflow para regressão responsiva.
 */

export const MOBILE_VIEWPORTS = [
  { name: 'iphone-se', width: 375, height: 667 },
  { name: 'iphone-14', width: 390, height: 844 },
  { name: 'narrow-320', width: 320, height: 640 },
];

export const APP_ROUTES = [
  { path: '/', viaHome: false },
  { path: '/calendar', viaHome: false },
  { path: '/clients', viaHome: true },
  { path: '/expenses', viaHome: false },
  { path: '/reports', viaHome: false },
  { path: '/goals', viaHome: false },
  { path: '/profile', viaHome: false },
];

export async function auditPageOverflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const offenders = [];

    const describeEl = (el) => {
      const tag = el.tagName.toLowerCase();
      const id = el.id ? `#${el.id}` : '';
      const cls =
        typeof el.className === 'string' && el.className.trim()
          ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}`
          : '';
      return `${tag}${id}${cls}`;
    };

    const isClippedByAncestor = (el) => {
      let parent = el.parentElement;
      while (parent && parent !== document.documentElement) {
        const ps = window.getComputedStyle(parent);
        if (
          ps.overflow === 'hidden' ||
          ps.overflowX === 'hidden' ||
          ps.overflow === 'clip' ||
          ps.overflowX === 'clip'
        ) {
          return true;
        }
        parent = parent.parentElement;
      }
      return false;
    };

    const visit = (el, depth = 0) => {
      if (depth > 10 || !el || el.nodeType !== 1) return;
      const rect = el.getBoundingClientRect();
      const delta = el.scrollWidth - el.clientWidth;
      if (rect.width > 0 && delta > 8) {
        const style = window.getComputedStyle(el);
        const allowsXScroll =
          style.overflowX === 'auto' ||
          style.overflowX === 'scroll' ||
          style.overflowX === 'overlay';
        const decorative =
          style.pointerEvents === 'none' ||
          (style.position === 'absolute' && isClippedByAncestor(el));
        if (!allowsXScroll && !decorative) {
          offenders.push({
            tag: el.tagName.toLowerCase(),
            selector: describeEl(el),
            delta: Math.round(delta),
          });
        }
      }
      for (const child of el.children) visit(child, depth + 1);
    };

    visit(document.body);
    offenders.sort((a, b) => b.delta - a.delta);

    const main = document.querySelector('[data-app-scroll]');
    let mainInfo = null;
    if (main) {
      mainInfo = {
        horizontal: main.scrollWidth > main.clientWidth + 2,
        verticalOverflow: main.scrollHeight > main.clientHeight + 8,
        scrollHeight: main.scrollHeight,
        clientHeight: main.clientHeight,
      };
    }

    return {
      docHorizontal: doc.scrollWidth > doc.clientWidth + 2,
      bodyHorizontal: document.body.scrollWidth > document.body.clientWidth + 2,
      main: mainInfo,
      offenders: offenders.slice(0, 8),
    };
  });
}

export async function scrollMainContainer(page) {
  return page.evaluate(() => {
    const main = document.querySelector('[data-app-scroll]');
    if (!main) return { ok: false, reason: 'no-main' };
    const before = main.scrollTop;
    const target = Math.min(main.scrollHeight, main.clientHeight + 400);
    main.scrollTop = target;
    const after = main.scrollTop;
    return {
      ok: true,
      before,
      after,
      moved: after - before,
      canScroll: main.scrollHeight > main.clientHeight + 8,
    };
  });
}

/**
 * Auditoria de overflow com overlay aberto (dialog, sheet, badge panel).
 */
export async function auditOverlayOverflow(page, { rootSelector } = {}) {
  return page.evaluate((selector) => {
    const doc = document.documentElement;
    const root =
      (selector && document.querySelector(selector)) ||
      document.querySelector('[role="dialog"]') ||
      document.querySelector('.bp-modal-scroll')?.closest('[class*="fixed"]') ||
      document.querySelector('.bp-modal-scroll');

    const offenders = [];
    const describeEl = (el) => {
      const tag = el.tagName.toLowerCase();
      const id = el.id ? `#${el.id}` : '';
      const cls =
        typeof el.className === 'string' && el.className.trim()
          ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}`
          : '';
      return `${tag}${id}${cls}`;
    };

    const visit = (el, depth = 0) => {
      if (depth > 8 || !el || el.nodeType !== 1) return;
      const rect = el.getBoundingClientRect();
      const delta = el.scrollWidth - el.clientWidth;
      if (rect.width > 0 && delta > 8) {
        const style = window.getComputedStyle(el);
        const allowsXScroll =
          style.overflowX === 'auto' ||
          style.overflowX === 'scroll' ||
          style.overflowX === 'overlay';
        if (!allowsXScroll && style.pointerEvents !== 'none') {
          offenders.push({
            selector: describeEl(el),
            delta: Math.round(delta),
          });
        }
      }
      for (const child of el.children) visit(child, depth + 1);
    };

    if (root) visit(root);
    offenders.sort((a, b) => b.delta - a.delta);

    const modalScroll = document.querySelector('.bp-modal-scroll');
    let modalScrollInfo = null;
    if (modalScroll) {
      modalScrollInfo = {
        horizontal: modalScroll.scrollWidth > modalScroll.clientWidth + 2,
        canScrollY: modalScroll.scrollHeight > modalScroll.clientHeight + 8,
      };
    }

    return {
      hasRoot: Boolean(root),
      docHorizontal: doc.scrollWidth > doc.clientWidth + 2,
      bodyHorizontal: document.body.scrollWidth > document.body.clientWidth + 2,
      modalScroll: modalScrollInfo,
      offenders: offenders.slice(0, 6),
    };
  }, rootSelector || null);
}

export async function scrollModalBody(page) {
  return page.evaluate(() => {
    const el =
      document.querySelector('.bp-modal-scroll') ||
      document.querySelector('[role="dialog"] [data-radix-scroll-area-viewport]');
    if (!el) return { ok: false, reason: 'no-modal-scroll' };
    const before = el.scrollTop;
    el.scrollTop = Math.min(el.scrollHeight, el.clientHeight + 300);
    const after = el.scrollTop;
    return {
      ok: true,
      moved: after - before,
      canScroll: el.scrollHeight > el.clientHeight + 8,
    };
  });
}
