// Quando uma versão nova é publicada, quem está com o app aberto ainda tem a lista de
// arquivos antiga. Ao abrir uma tela, o arquivo antigo pode não existir mais e a tela fica
// em branco. Aqui: se o carregamento de uma tela falhar por isso, recarrega o app uma vez
// (já na versão nova). Se falhar de novo, mostra o erro normal (sem ficar em loop).
const FLAG = 'bp-chunk-reload-at';

export function isChunkLoadError(err) {
  const msg = String(err?.message || err || '');
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError|Loading chunk \d+ failed/i.test(msg);
}

export function withChunkReload(importFn) {
  return () =>
    importFn().catch((err) => {
      if (typeof window !== 'undefined' && isChunkLoadError(err)) {
        let last = 0;
        try { last = Number(window.sessionStorage.getItem(FLAG)) || 0; } catch { /* sem storage */ }
        if (Date.now() - last > 30000) {
          try { window.sessionStorage.setItem(FLAG, String(Date.now())); } catch { /* sem storage */ }
          window.location.reload();
          return new Promise(() => {}); // espera o reload
        }
      }
      throw err;
    });
}
