import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

export function useHasMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,  // Client snapshot
    () => false  // Server/SSR snapshot
  );
}