/**
 * Padrão de exibição: empresa (cliente) em destaque, show (event.title) como subtítulo.
 * Usado em Calendar, Kanban, Relatórios, CRM, etc.
 */

/** Nome exibível do cliente (name com fallback para company). */
export function getClientDisplayName(client) {
  if (!client) return null;
  const name = (client.name || '').trim();
  const company = (client.company || '').trim();
  if (name) return name;
  if (company) return company;
  return null;
}

export function buildClientMap(clients = []) {
  return new Map(clients.map((c) => [c.id, c]));
}

export function resolveClientForEvent(event, clientsOrMap) {
  if (!event?.client_id) return null;
  if (clientsOrMap instanceof Map) {
    return clientsOrMap.get(event.client_id) ?? null;
  }
  return (clientsOrMap || []).find((c) => c.id === event.client_id) ?? null;
}

export function enrichEventsWithClients(events = [], clients = []) {
  const map = buildClientMap(clients);
  return events.map((ev) => {
    const displayName = getClientDisplayName(resolveClientForEvent(ev, map));
    if (!displayName) return ev;
    return ev.client_name === displayName ? ev : { ...ev, client_name: displayName };
  });
}

export function getEventDisplay(event, client) {
  const companyName =
    getClientDisplayName(client) ||
    event?.clients?.name ||
    event?.client_name ||
    'Sem empresa';

  const rawTitle = (event?.title || '').trim();
  const eventName = rawTitle || companyName;

  const sameAsCompany =
    rawTitle &&
    rawTitle.localeCompare(companyName, 'pt-BR', { sensitivity: 'accent' }) === 0;

  return {
    companyName,
    eventName,
    showEventSubtitle: Boolean(rawTitle) && !sameAsCompany,
  };
}
