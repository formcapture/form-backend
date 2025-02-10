export const createFileIdentifierFromPath = (path: string) => {
  const parts = path.split('.');
  parts.pop();
  const filteredParts = parts.filter(part => Number.isNaN(parseInt(part, 10)));
  return filteredParts.join('/');
};
