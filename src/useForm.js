import { useState } from 'react';
import _get from 'lodash.get';
import update from 'update-js';
import { callRuleValidator, callValueValidator } from './validations';

export function useForm(initialAttrs, validation) {
  const [attrs, setAttrs] = useState(initialAttrs);

  return validation === undefined ?
    usePlainForm(attrs, setAttrs) :
    useValidatedForm(attrs, setAttrs, validation);
}

export function useControlledForm({attrs, onChange}, validation) {
  return validation === undefined ?
    usePlainForm(attrs, onChange) :
    useValidatedForm(attrs, onChange, validation);
}

function usePlainForm(attrs, setAttrs) {
  const [errors, setErrors] = useState({});

  const get = path => path ? _get(attrs, path) : attrs;
  const set = (path, value) => {
    if (value) {
      setAttrs(update(attrs, path, value));
    } else {
      setAttrs(path);
    }
  }
  const getError = path => errors[path];
  const setError = (path, value) => setErrors({...errors, [path]: value});
  const input = (path, onChange) => {
    if (onChange === undefined) {
      onChange = value => set(path, value);
    }

    return {
      value: get(path),
      onChange,
      error: errors[path],
      name: path
    };
  };

  return {get, set, getError, setError, input, $: input};
}

function useValidatedForm(attrs, setAttrs, validationConfig) {
  const [errors, setErrors] = useState({});
  const [shouldValidateOnChange, setShouldValidateOnChange] = useState(false);

  const get = path => path ? _get(attrs, path) : attrs;
  const getError = path => errors[path];
  const setError = (path, value) => setErrors({...errors, [path]: value});

  if (typeof validationConfig === 'function') {
    validationConfig = validationConfig(get);
  }

  const validateAttrs = (attributes, {onValid, onError} = {}) => {
    const nextErrors = {};

    Object.keys(validationConfig).forEach((name) => {
      callRuleValidator(validationConfig, nextErrors, name, attributes);
    });

    const valid = Object.getOwnPropertyNames(nextErrors).length === 0;

    setErrors(nextErrors);
    setShouldValidateOnChange(true);
    if (valid && onValid) {
      onValid();
    }
    if (!valid && onError) {
      onError(nextErrors);
    }
  };

  const set = (name, value) => {
    const nextAttrs = value === undefined ? name : update(attrs, name, value);
    setAttrs(nextAttrs);

    if (!shouldValidateOnChange) return;

    if (typeof name === 'string' && !(typeof value === 'object') && !Array.isArray(value)) {
      const error = callValueValidator(validationConfig, name, value);
      return setError(name, error);
    }

    validateAttrs(nextAttrs);
  };

  const input = (path, onChange) => {
    if (onChange === undefined) {
      onChange = value => set(path, value);
    }

    return {
      value: get(path),
      onChange,
      error: errors[path],
      name: path
    };
  };

  const validate = (opts) => {
    return validateAttrs(get(), opts);
  };

  const submitWith = handler => () => {
    validate({
      onValid() {
        handler(get());
      }
    });
  };

  return {
    get,
    set,
    input,
    $: input,
    getError,
    setError,
    setErrors,
    validate,
    submitWith
  };
}
