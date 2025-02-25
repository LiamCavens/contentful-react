export function camelCaseToCapitalizedWords(input: string): string {
  if (input === 'poi') {
    return 'PoI';
  }
  return input
    .replace(/([A-Z])/g, ' $1') // Add space before each uppercase letter
    .replace(/^./, str => str.toUpperCase()) // Capitalize the first letter
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}