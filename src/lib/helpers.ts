export function pathPatternToExpress(pattern: string) {
  return pattern.replace(/\{(.+?)\}/g, ":$1");
}