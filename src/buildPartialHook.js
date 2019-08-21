import { useEffect, useCallback } from "react";
import { addPartialValidations, removePartialValidations } from "./reducer";

export default function buildPartialHook({
    dispatch,
    get: formGet,
    set: formSet,
    getError: formGetError,
    input: formInput
  }) {
  return function usePartial(prefix, validations = {}) {
    useEffect(() => {
      if (Object.getOwnPropertyNames(validations).length > 0) {
        dispatch(addPartialValidations(prefix, validations));

        return () => {
          dispatch(removePartialValidations(prefix, validations));
        };
      }

    }, [prefix]);

    const attrs = formGet(prefix);

    const get = useCallback(path => path ? formGet(`${prefix}.${path}`) : formGet(prefix), [attrs]);

    const set = useCallback((pathOrAttrs, value) => {
      if (typeof pathOrAttrs === "object") {
        const partialObj = {};

        for (const key in pathOrAttrs) {
          partialObj[`${prefix}.${key}`] = pathOrAttrs[key];
        }

        return formSet(partialObj);
      } else {
        return formSet(`${prefix}.${pathOrAttrs}`, value);
      }
    }, []);

    const getError = useCallback(path => formGetError(`${prefix}.${path}`), []);

    const input = (path, onChange) => formInput(`${prefix}.${path}`, onChange);

    return {get, set, getError, input, $: input};
  };
}
