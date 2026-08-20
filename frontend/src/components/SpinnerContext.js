import React, { createContext, useState, useCallback } from 'react';

export const SpinnerContext = createContext();

export const SpinnerProvider = ({ children }) => {
  const [spinning, setSpinning] = useState(false);

  const showSpinner = useCallback(() => setSpinning(true), []);
  const hideSpinner = useCallback(() => setSpinning(false), []);

  return (
    <SpinnerContext.Provider value={{ spinning, showSpinner, hideSpinner }}>
      {children}
    </SpinnerContext.Provider>
  );
};