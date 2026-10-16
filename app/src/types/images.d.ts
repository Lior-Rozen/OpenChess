// Image imports resolve to a source that <Image> accepts (Metro bundles the file).
declare module '*.png' {
  const source: import('react-native').ImageSourcePropType;
  export default source;
}
