import { useReducer, useCallback, useEffect, useMemo } from 'react';
import getValue from 'get-lookup';
import reducer, {
  init,
  setAttr,
  setAttrs,
  setFullAttrs,
  addConfig,
  removeConfig,
  amendInitialConfig,
  validate as doValidate,
  setError as doSetError,
  setErrors as doSetErrors,
  reset as doReset,
  setState as doSetState
} from './reducer';
import { ValidationPromise } from './validations';
import buildPartialHook from './buildPartialHook';
import HandlersCache from './HandlersCache';
import { resolveConfig, DEFAULT_CONFIG } from './config';

export function useForm(config = DEFAULT_CONFIG, secondaryConfig) {
  const initial = useMemo(() => init(config, secondaryConfig), []);
  const [{ attrs, errors, isPristine, pureHandlers, helpers, action }, dispatch] = useReducer(reducer, initial);
  const isValid = !Object.values(errors).some(Boolean);

  const handlersCache = useMemo(() => new HandlersCache(pureHandlers), []);

  const get = useCallback(name => name ? getValue(attrs, name) : attrs, [attrs]);

  const set = useCallback((pathOrAttrsOrFn, valueOrPrefix) => {
    if (typeof pathOrAttrsOrFn === 'function' || typeof pathOrAttrsOrFn === 'object') {
      return dispatch(setAttrs(pathOrAttrsOrFn, valueOrPrefix));
    } else {
      return dispatch(setAttr(pathOrAttrsOrFn, valueOrPrefix));
    }
  }, []);

  // Used in a useEffect to apply external attributes to a form.
  const setFormAttrs = useCallback((attrs) => {
    return dispatch(setFullAttrs(attrs));
  }, []);

  const validate = useCallback((name) => {
    if (typeof name !== 'string') name = null;

    return new ValidationPromise((resolve, reject) => {
      dispatch(doValidate(name, resolve, reject));
    });
  }, []);

  const getError = useCallback((name) => errors[name], [errors]);

  const setError = useCallback((name, error) => {
    return new Promise((resolve) => {
      dispatch(doSetError(name, error));
      resolve({ [name]: error });
    });
  }, []);

  const setErrors = useCallback((errors) => {
    if (errors && typeof errors === 'object' && errors.constructor === Object) {
      return new Promise((resolve) => {
        dispatch(doSetErrors(errors));
        resolve(errors);
      });
    }
    throw errors;
  }, []);

  const dropError = useCallback(name => dispatch(doSetError(name, undefined)), []);

  const reset = useCallback((attrsOrFn) => dispatch(doReset(attrsOrFn)), []);

  const setState = useCallback((setter) => dispatch(doSetState(setter)), []);

  const withValidation = (callback) => () => validate().then(callback);

  const defaultOnChange = useCallback((value, { name }) => set(name, value), []);

  const input = (name, onChange = defaultOnChange) => {
    return {
      value: get(name),
      onChange: handlersCache.fetch(name, onChange, () => (value, meta) => onChange(value, { ...meta, name })),
      error: errors[name],
      name
    };
  };

  const usePartial = buildPartialHook({ dispatch, get, set, getError, input });

  const useConfig = (fn, deps) => {
    useEffect(() => {
      const config = resolveConfig(fn());
      dispatch(addConfig(config));

      return () => {
        dispatch(removeConfig(config));
      };
    }, deps);
  };

  const _amendInitialConfig = useCallback((config) => {
    if (config !== secondaryConfig) {
      dispatch(amendInitialConfig(resolveConfig(config)));
    }
  }, []);

  const formHelpers = {
    attrs,
    get,
    set,
    isPristine,
    setFormAttrs,
    errors,
    getError,
    setError,
    setErrors,
    dropError,
    isValid,
    reset,
    setState,
    usePartial,
    useConfig,
    validate,
    withValidation,
    input,
    $: input,
    _amendInitialConfig,
    _action: action
  };

  return helpers.reduce((hlp, fn) => ({ ...hlp, ...fn(hlp) }), formHelpers);
}
