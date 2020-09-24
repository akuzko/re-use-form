import { useEffect, useCallback } from 'react';
import { addConfig, removeConfig } from './reducer';
import { resolveConfig } from './config';

export default function buildPartialHook({
    dispatch,
    get: formGet,
    set: formSet,
    getError: formGetError,
    input: formInput
  }) {
  return function usePartial({ prefix, ...config }) {
    useEffect(() => {
      const validations = config.validations || {};

      if (Object.getOwnPropertyNames(validations).length > 0) {
        config.validations = {};

        for (const key in validations) {
          config.validations[`${prefix}.${key}`] = validations[key];
        }

        const resolvedConfig = resolveConfig(config);

        dispatch(addConfig(resolvedConfig));

        return () => {
          dispatch(removeConfig(resolvedConfig));
        };
      }

    }, [prefix]);

    const attrs = formGet(prefix);

    const get = useCallback(path => path ? formGet(`${prefix}.${path}`) : formGet(prefix), [attrs]);

    const set = useCallback((pathOrAttrs, value) => {
      if (typeof pathOrAttrs === 'object') {
        const partialObj = {};

        for (const key in pathOrAttrs) {
          partialObj[`${prefix}.${key}`] = pathOrAttrs[key];
        }

        return formSet(partialObj);
      } else {
        return formSet(`${prefix}.${pathOrAttrs}`, value);
      }
    }, []);

    const getError = useCallback(path => formGetError(`${prefix}.${path}`), [formGetError]);

    const input = (path, onChange) => formInput(`${prefix}.${path}`, onChange);

    return { attrs, get, set, getError, input, $: input };
  };
}
