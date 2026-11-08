import { createContext } from 'react';

export const BookActionsContext = createContext({
  replayPrologue: () => {},
  replaying: false,
  openWorkshop: (_replace?: boolean) => {},
  enteringWorkshop: false,
});
