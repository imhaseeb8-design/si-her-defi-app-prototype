'use client';
import { useSyncExternalStore } from 'react';
import { getState, initialState, subscribe, type DemoState } from '../mock/server';

const serverSnapshot = initialState();

/** Live view of the simulated backend's state (flags, presets) for the Prototype panel and simulations. */
export function useDemo(): DemoState {
  return useSyncExternalStore(subscribe, getState, () => serverSnapshot);
}
