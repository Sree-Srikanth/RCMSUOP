import { createContext, useContext, useEffect, useState } from 'react';
import { get } from './api';

const MasterContext = createContext(null);

export function MasterProvider({ children }) {
  const [master, setMaster] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    get('/master').then(setMaster).catch(setError);
  }, []);
  return <MasterContext.Provider value={{ master, error }}>{children}</MasterContext.Provider>;
}

export function useMaster() {
  return useContext(MasterContext).master;
}
