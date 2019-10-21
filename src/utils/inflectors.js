import {
  camelCase as _camelCase,
  kebabCase as _kebabCase
} from 'lodash';

const selfish = fn => function self() {
  return fn(self, ...arguments);
};

const transformKeys = (mut) => selfish(
  (self, o) => Object.entries(o).reduce(
    (memo, [key, value]) => {
      memo[mut(key)] = value && typeof value === 'object'
        ? self(value)
        : value;

      return memo;
    },
    Object.create(null)
  )
);

export const
  dasherizeKeys = transformKeys(_kebabCase),
  dedasherizeKeys = transformKeys(_camelCase);
