// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { unstickBody } from './useUnstickBody';

describe('destrava a tela depois de fechar janelas', () => {
  beforeEach(() => { document.body.innerHTML = ''; document.body.removeAttribute('style'); document.body.removeAttribute('data-scroll-locked'); });

  it('sem janela aberta: tira a trava de toque e de rolagem', () => {
    document.body.style.pointerEvents = 'none';
    document.body.setAttribute('data-scroll-locked', '1');
    document.body.style.overflow = 'hidden';
    expect(unstickBody()).toBe(true);
    expect(document.body.style.pointerEvents).toBe('');
    expect(document.body.hasAttribute('data-scroll-locked')).toBe(false);
    expect(document.body.style.overflow).toBe('');
  });

  it('com janela aberta: nao mexe', () => {
    document.body.style.pointerEvents = 'none';
    const d = document.createElement('div');
    d.setAttribute('role', 'dialog');
    d.setAttribute('data-state', 'open');
    document.body.appendChild(d);
    expect(unstickBody()).toBe(false);
    expect(document.body.style.pointerEvents).toBe('none');
  });
});
