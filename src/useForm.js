import { useReducer, useCallback, useEffect, useMemo } from "react";
import getValue from "get-lookup";
import reducer, {
  init,
  setConfig,
  setAttr,
  setAttrs,
  validate as doValidate,
  setError as doSetError,
  setErrors as doSetErrors,
  reset as doReset
} from "./reducer";
import { ValidationPromise } from "./validations";
import buildPartialHook from "./buildPartialHook";
import HandlersCache from "./HandlersCache";

export function useForm(initialAttrs, config = {}) {
  const initial = useMemo(() => init(initialAttrs, config), []);
  const [{attrs, errors, pureHandlers}, dispatch] = useReducer(reducer, initial);

  useEffect(() => {
    if (config.deps) {
      dispatch(setConfig(config));
    }
  }, config.deps || []);

  const handlersCache = useMemo(() => new HandlersCache(pureHandlers), []);

  const get = useCallback(path => path ? getValue(attrs, path) : attrs, [attrs]);

  const set = useCallback((pathOrAttrs, value) => {
    if (typeof pathOrAttrs === "object") {
      return dispatch(setAttrs(pathOrAttrs));
    } else {
      return dispatch(setAttr(pathOrAttrs, value));
    }
  }, []);

  const validate = useCallback((path) => {
    return new ValidationPromise((resolve, reject) => {
      dispatch(doValidate(path, resolve, reject));
    });
  }, []);

  const getError = useCallback((path) => errors[path], [errors]);

  const setError = useCallback((name, error) => dispatch(doSetError(name, error)), []);

  const setErrors = useCallback((errors) => {
    if (errors && typeof errors === "object" && errors.constructor === Object) {
      return dispatch(doSetErrors(errors));
    }
    throw errors;
  }, []);

  const reset = useCallback((attrs) => dispatch(doReset(attrs)), []);

  const withValidation = (callback) => () => validate().then(callback);

  const defaultOnChange = useCallback((path, value) => set(path, value), []);

  const input = (path, onChange = defaultOnChange) => {
    return {
      value: get(path),
      onChange: handlersCache.fetch(path, onChange, () => (value, ...args) => onChange(path, value, ...args)),
      error: errors[path],
      name: path
    };
  };

  const usePartial = buildPartialHook({dispatch, get, set, getError, input});

  return {
    get,
    set,
    getError,
    setError,
    setErrors,
    reset,
    usePartial,
    validate,
    withValidation,
    input,
    $: input
  };
}
