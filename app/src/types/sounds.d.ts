// Sound imports resolve to an asset id that expo-audio accepts (Metro bundles the file).
declare module '*.wav' {
  const source: number;
  export default source;
}
