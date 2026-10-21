// No visual All Access o mes tem um botao por dia: toca no dia e abre o evento por "Abrir".
export async function abrirEventoDemo(page) {
  const dia = page.getByRole('button', { name: /^Dia \d+: E2E Cliente Demo/i }).first();
  await dia.click();
  await page.getByRole('button', { name: /^Abrir$/ }).first().click();
}
