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
          const path = `${prefix}.${key}`;

          config.validations[path] = validations[key];

          if (config.validations[path].partialDeps) {
            const deps = config.validations[path].deps || [];

            config.validations[path].deps =
              deps.concat(config.validations[path].partialDeps.map((dep) => `${prefix}.${dep}`));
          }
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

    const set = useCallback((pathOrAttrsOrFn, value) => {
      if (typeof pathOrAttrsOrFn === 'string') {
        return formSet(`${prefix}.${pathOrAttrsOrFn}`, value);
      } else {
        return formSet(pathOrAttrsOrFn, prefix);
      }
    }, []);

    const getError = useCallback(path => formGetError(`${prefix}.${path}`), [formGetError]);

    const input = (path, onChange) => formInput(`${prefix}.${path}`, onChange);

    return { attrs, get, set, getError, input, $: input };
  };
}
