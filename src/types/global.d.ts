/// <reference types="nativewind/types" />

// Permite importar arquivos CSS no _layout.tsx (NativeWind)
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}
