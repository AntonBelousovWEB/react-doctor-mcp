import * as path from "node:path";

export const toRelativePath = (filePath: string, rootDirectory: string): string => {
  const resolvedFilePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(rootDirectory, filePath);
  const relativePath = path.relative(rootDirectory, resolvedFilePath);
  if (relativePath === "") return path.basename(resolvedFilePath);
  return relativePath.split(path.sep).join("/");
};
