import { useReducer, useCallback, useEffect } from "react";
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

export function useForm(initialAttrs, config = {}) {
  const [{attrs, errors}, dispatch] = useReducer(reducer, init(initialAttrs, config));

  useEffect(() => {
    if (config.useMemo === false) {
      dispatch(setConfig(config));
    }
  }, [config]);

  const get = useCallback((path) => {
    return path ? getValue(attrs, path) : attrs;
  }, [attrs]);

  const set = useCallback((pathOrAttrs, value) => {
    if (typeof pathOrAttrs === "object") {
      return dispatch(setAttrs(pathOrAttrs));
    } else {
      return dispatch(setAttr(pathOrAttrs, value));
    }
  }, []);

  const validate = useCallback((callbacks = {}) => dispatch(doValidate(callbacks)), []);

  const getError = useCallback((path) => errors[path], [errors]);

  const setError = useCallback((name, error) => dispatch(doSetError(name, error)), []);

  const setErrors = useCallback((errors) => dispatch(doSetErrors(errors)), []);

  const reset = useCallback((attrs) => dispatch(doReset(attrs)), []);

  const withValidation = (callback) => () => validate({onValid: callback});

  const input = (path, onChange) => {
    if (onChange === undefined) {
      onChange = (path, value) => set(path, value);
    }

    // TODO: consider caching `onChange` handler
    return {
      value: get(path),
      onChange: value => onChange(path, value),
      error: errors[path],
      name: path
    };
  };

  return {
    get,
    set,
    getError,
    setError,
    setErrors,
    reset,
    validate,
    withValidation,
    input,
    $: input
  };
}
