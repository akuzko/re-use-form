import { useReducer, useCallback, useEffect, useMemo } from "react";
import getValue from "get-lookup";
import reducer, {
  init,
  setConfig,
  setAttr,
  setAttrs,
  injectValidations,
  ejectValidations,
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
  const isValid = !Object.values(errors).some(Boolean);

  useEffect(() => {
    if (config.deps) {
      dispatch(setConfig(config));
    }
  }, config.deps || []);

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

  const useMoreValidations = (fn, deps) => {
    useEffect(() => {
      const validations = fn();
      const revalidate = () => {
        for (const name in validations) {
          validate(name);
        }
      };
      dispatch(injectValidations(validations));
      if (!isValid) revalidate();

      return () => {
        dispatch(ejectValidations(validations));
        if (!isValid) revalidate();
      };
    }, [...deps, isValid]);
  };

  return {
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
    validate,
    withValidation,
    useMoreValidations,
    input,
    $: input
  };
}
