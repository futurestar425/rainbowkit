import { lowerCase } from "./lowerCase";

export const stringEquals = (str1: string, str2: string) => {
  return lowerCase(str1) === lowerCase(str2);
};
