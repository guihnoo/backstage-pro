import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function useLiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return {
    time: format(now, 'HH:mm:ss'),
    timeShort: format(now, 'HH:mm'),
    dateLabel: format(now, "EEEE, d 'de' MMMM", { locale: ptBR }),
  };
}
