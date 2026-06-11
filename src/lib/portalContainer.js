/**
 * Radix Dialog (modal) marca o resto da página como inert.
 * Popover/Select portados no body ficam invisíveis aos cliques.
 * Portalar para dentro do dialog aberto resolve combobox em modais.
 */
export function getOpenDialogElement() {
  if (typeof document === 'undefined') return null;
  return document.querySelector('[role="dialog"][data-state="open"]');
}
