import { TransformFunction } from "./SchemaProperty";

// Predefined transformations

export const Transforms = {
  toString: <T>(): TransformFunction<T, string> => ({
    name: 'string',
    transform: (input) => String(input)
  }),

  toNumber: (): TransformFunction<string, number> => ({
    name: 'number',
    transform: (input) => Number(input),
    validate: (input) => !isNaN(Number(input))
  }),

  addBearerPrefix: (): TransformFunction<string, string> => ({
    name: 'bearer-prefix',
    transform: (token) => `Bearer ${token}`,
    validate: (token) => typeof token === 'string' && token.length > 0
  }),

  wrapInArray: <T>(): TransformFunction<T, T[]> => ({
    name: 'array-wrap',
    transform: (input) => [input]
  }),

  extractFirst: <T>(): TransformFunction<T[], T | undefined> => ({
    name: 'array-first',
    transform: (array) => array[0],
    validate: (array) => Array.isArray(array) && array.length > 0
  }),

  toUpperCase: (): TransformFunction<string, string> => ({
    name: 'upper',
    transform: (input) => input.toUpperCase()
  }),

  toLowerCase: (): TransformFunction<string, string> => ({
    name: 'lower',
    transform: (input) => input.toLowerCase()
  })
};
