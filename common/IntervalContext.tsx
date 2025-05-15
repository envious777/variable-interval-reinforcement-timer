import React, { createContext, useCallback, useContext, useState } from 'react';
import type { IntervalRecord } from '../app/RecordSession';

interface IntervalContextType {
  intervals: IntervalRecord[];
  setIntervals: React.Dispatch<React.SetStateAction<IntervalRecord[]>>;
  updateIntervalAnswer: (index: number, answer?: 'yes' | 'no' | 'missed') => void;
}

const IntervalContext = createContext<IntervalContextType | undefined>(undefined);

export const useIntervalContext = () => {
  const ctx = useContext(IntervalContext);
  if (!ctx) throw new Error('useIntervalContext must be used within IntervalProvider');
  return ctx;
};

export const IntervalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [intervals, setIntervals] = useState<IntervalRecord[]>([]);

  const updateIntervalAnswer = useCallback((index: number, answer?: 'yes' | 'no' | 'missed') => {
    setIntervals(prev => prev.map(i => i.index === index ? { ...i, answer } : i));
  }, []);

  return (
    <IntervalContext.Provider value={{ intervals, setIntervals, updateIntervalAnswer }}>
      {children}
    </IntervalContext.Provider>
  );
};
