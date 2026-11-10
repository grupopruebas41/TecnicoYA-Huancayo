import {createContext, useContext} from 'react';

/**
 * Controles temporales del shell para el tutorial (Fase 5): expandir el menú contraído y abrir el cajón del celular sin
 * guardar nada en la cuenta ni mover el foco. Al terminar el tutorial vuelven a su estado.
 */
export const ShellContext = createContext({setTourMode: () => {}, setTourDrawer: () => {}});
export const useShell = () => useContext(ShellContext);
