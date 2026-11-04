import { createContext } from 'react';

/** Presentation only: the greenhouse follows the actual game content height. */
export const SceneSizeContext = createContext<(height: number) => void>(() => {});
