import type { Persistence } from 'firebase/auth';

// getReactNativePersistence existe no bundle React Native de @firebase/auth
// (dist/rn/index.js) mas está ausente dos tipos TypeScript que apontam para o
// bundle browser. Esta augmentation torna o import type-safe sem @ts-ignore.
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: object): Persistence;
}
