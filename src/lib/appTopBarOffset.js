// Altura da barra do topo, num arquivo próprio e leve: o App (que abre no login) precisa só
// deste número, e importá-lo de AppTopBar puxava a barra inteira (notificações, busca global)
// para a primeira carga.
export const TOP_BAR_HEIGHT = '3.25rem';

export function getAppTopBarOffset() {
  return `calc(${TOP_BAR_HEIGHT} + env(safe-area-inset-top, 0px))`;
}
