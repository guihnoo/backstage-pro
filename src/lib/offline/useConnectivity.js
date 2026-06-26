import { useEffect, useState } from 'react';
import { getConnectivityState, subscribeConnectivity } from './connectivityStore';

/** Hook React para estado de conexão detectado automaticamente pelo app. */
export function useConnectivity() {
  const [state, setState] = useState(() => getConnectivityState());

  useEffect(() => subscribeConnectivity(setState), []);

  return {
    online: state.online,
    offline: !state.online,
  };
}
