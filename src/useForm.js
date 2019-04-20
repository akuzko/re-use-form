import { useState } from 'react';
import _get from 'lodash.get';
import update from 'update-js';
import { callRuleValidator, callValueValidator } from './validations';

export default function useForm(initialState = {}) {
  const [attrs, setAttrs] = useState(initialState);
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
  const setError = (path, value) => setErrors({ ...errors, [path]: value });
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

  const helpers = { get, set, input, $: input, getError, setError, setErrors };

  helpers.withValidation = (config) => {
    if (typeof config === 'function') {
      config = config(get);
    }

    const [shouldValidateOnChange, setShouldValidateOnChange] = useState(false);

    const validateAttrs = (attributes, { onValid, onError } = {}) => {
      const nextErrors = {};

      Object.keys(config).forEach((name) => {
        callRuleValidator(config, nextErrors, name, attributes);
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

    const validatedSet = (name, value) => {
      const nextAttrs = value === undefined ? name : update(attrs, name, value);
      setAttrs(nextAttrs);

      if (!shouldValidateOnChange) return;

      if (typeof name === 'string' && !(typeof value === 'object') && !Array.isArray(value)) {
        const error = callValueValidator(config, name, value);
        return setError(name, error);
      }

      validateAttrs(nextAttrs);
    };

    const validatedInput = (path, onChange) => {
      if (onChange === undefined) {
        onChange = value => validatedSet(path, value);
      }

      return { ...input(path), onChange };
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
      set: validatedSet,
      input: validatedInput,
      $: validatedInput,
      getError,
      setError,
      setErrors,
      validate,
      submitWith
    };
  };

  return helpers;
}
