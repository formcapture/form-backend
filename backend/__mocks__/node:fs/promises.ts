export const mkdir = jest.fn();
export const readdir = jest.fn();
export const stat = jest.fn();
export const unlink = jest.fn();
export const writeFile = jest.fn();
export const readFile = jest.fn();

export default {
  mkdir,
  readdir,
  readFile,
  stat,
  unlink,
  writeFile
};
