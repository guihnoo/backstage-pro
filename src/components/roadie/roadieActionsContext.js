import { createContext, useContext } from 'react';

/** Roadie fase 2: dados e gravações que a página do Roadie oferece aos cartões de ação. */
export const RoadieActionsContext = createContext(null);

export function useRoadieActions() {
  return useContext(RoadieActionsContext);
}
