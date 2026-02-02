/** Convert a string to a safe JavaScript identifier */
export const toIdentifier = (s: string): string =>
  s.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^(\d)/, '_$1');

/** Convert a level name to a scene class name */
export const toSceneKey = (name: string): string =>
  'Level_' + toIdentifier(name);

/** Indent each line of a string by a given number of spaces */
export const indent = (code: string, spaces: number): string => {
  const pad = ' '.repeat(spaces);
  return code
    .split('\n')
    .map((line) => (line.trim() ? pad + line : line))
    .join('\n');
};

/** Convert hex color string to Phaser-compatible integer */
export const hexToInt = (hex: string): number =>
  parseInt(hex.replace('#', ''), 16);

/** Capitalize the first letter of a string */
export const capitalize = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1);
