import { useReducer, useCallback, useEffect, useMemo } from "react";
import getValue from "get-lookup";
import reducer, {
  init,
  setAttr,
  setAttrs,
  addConfig,
  removeConfig,
  validate as doValidate,
  setError as doSetError,
  setErrors as doSetErrors,
  reset as doReset
} from "./reducer";
import { ValidationPromise } from "./validations";
import buildPartialHook from "./buildPartialHook";
import HandlersCache from "./HandlersCache";
import { resolveConfig, DEFAULT_CONFIG } from "./config";

export function useForm(config = DEFAULT_CONFIG) {
  const initial = useMemo(() => init(config), []);
  const [{attrs, errors, pureHandlers, helpers}, dispatch] = useReducer(reducer, initial);
  const isValid = !Object.values(errors).some(Boolean);

  const handlersCache = useMemo(() => new HandlersCache(pureHandlers), []);

  const get = useCallback(name => name ? getValue(attrs, name) : attrs, [attrs]);

  const set = useCallback((pathOrAttrs, value) => {
    if (typeof pathOrAttrs === "object") {
      return dispatch(setAttrs(pathOrAttrs));
    } else {
      return dispatch(setAttr(pathOrAttrs, value));
    }
  }, []);

  const validate = useCallback((name) => {
    if (typeof name !== "string") name = null;

    return new ValidationPromise((resolve, reject) => {
      dispatch(doValidate(name, resolve, reject));
    });
  }, []);

  const getError = useCallback((name) => errors[name], [errors]);

  const setError = useCallback((name, error) => dispatch(doSetError(name, error)), []);

  const setErrors = useCallback((errors) => {
    if (errors && typeof errors === "object" && errors.constructor === Object) {
      return dispatch(doSetErrors(errors));
    }
    throw errors;
  }, []);

  const dropError = useCallback(name => dispatch(doSetError(name, undefined)), []);

  const reset = useCallback((attrs) => dispatch(doReset(attrs)), []);

  const withValidation = (callback) => () => validate().then(callback);

  const defaultOnChange = useCallback((value, {name}) => set(name, value), []);

  const input = (name, onChange = defaultOnChange) => {
    return {
      value: get(name),
      onChange: handlersCache.fetch(name, onChange, () => (value, meta) => onChange(value, {...meta, name})),
      error: errors[name],
      name
    };
  };

  const usePartial = buildPartialHook({dispatch, get, set, getError, input});

  const useConfig = (fn, deps) => {
    useEffect(() => {
      const config = resolveConfig(fn());
      dispatch(addConfig(config));

      return () => {
        dispatch(removeConfig(config));
      };
    }, deps);
  };

  const formHelpers = {
    attrs,
    get,
    set,
    errors,
    getError,
    setError,
    setErrors,
    dropError,
    isValid,
    reset,
    usePartial,
    useConfig,
    validate,
    withValidation,
    input,
    $: input
  };

  return helpers.reduce((hlp, fn) => ({...hlp, ...fn(hlp)}), formHelpers);
}
