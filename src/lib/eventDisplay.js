export function getEventDisplay(event, client) {
  const companyName =
    client?.name ||
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
