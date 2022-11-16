export function pathPatternToExpress(pattern: string) {
  return pattern.replace(/\{(.+?)\}/g, ":$1");
}

export function expressPathToFilePath(pattern: string) {
  return pattern.replace(/:([^/]*)/g, "[$1]");
}
