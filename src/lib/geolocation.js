/**
 * Promessa em torno de navigator.geolocation (GPS do dispositivo).
 */
export function getCurrentPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocalização não suportada neste dispositivo.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => {
        const messages = {
          1: 'Permissão de localização negada. Ative nas configurações do navegador.',
          2: 'Localização indisponível no momento.',
          3: 'Tempo esgotado ao obter sua posição. Tente novamente.',
        };
        reject(new Error(messages[err.code] || 'Não foi possível obter sua localização.'));
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 30000,
        ...options,
      },
    );
  });
}
