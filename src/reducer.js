import { validateAttr, validateRule } from "./validations";
import update from "update-js";

export default function reducer(state, action) {
  const {attrs, errors, shouldValidateOnChange, validations, validationOptions} = state;

  switch (action.type) {
    case "setConfig": {
      return {...state, ...resolveConfig(action.config)};
    }
    case "setAttr": {
      const {path, value} = action;

      if (shouldValidateOnChange) {
        const nextAttrs = update(attrs, path, value);
        const nextErrors = {[path]: validateAttr(validations, validationOptions, path, value)};

        if (Array.isArray(value)) {
          Object.keys(validations).forEach((rule) => {
            if (rule !== path && rule.startsWith(path)) {
              validateRule(validations, validationOptions, rule, nextAttrs, nextErrors);
            }
          });
        }

        return {
          ...state,
          attrs: nextAttrs,
          errors: {
            ...errors,
            ...nextErrors
          }
        };
      } else {
        return update(state, `attrs.${path}`, value);
      }
    }
    case "setAttrs": {
      const nextAttrs = {...attrs};
      const nextErrors = shouldValidateOnChange ? {...errors} : errors;

      for (const path in action.attrs) {
        update.in(nextAttrs, path, action.attrs[path]);

        if (shouldValidateOnChange) {
          nextErrors[path] = validateAttr(validations, validationOptions, path, action.attrs[path]);
        }
      }

      return {...state, attrs: nextAttrs, errors: nextErrors};
    }
    case "validate": {
      const {onValid, onError} = action;
      const nextErrors = {};

      Object.keys(validations).forEach((rule) => {
        validateRule(validations, validationOptions, rule, attrs, nextErrors);
      });

      const isValid = Object.getOwnPropertyNames(nextErrors).length === 0;

      if (isValid && onValid) {
        requestAnimationFrame(() => onValid(attrs));
      } else if (!isValid && onError) {
        requestAnimationFrame(() => onError(nextErrors));
      }

      return {
        ...state,
        errors: nextErrors,
        shouldValidateOnChange: true
      };
    }
    case "setError": {
      const {name, error} = action;

      return {...state, errors: {...state.errors, [name]: error}};
    }
    case "setErrors": {
      return {...state, errors: action.errors};
    }
    case "reset": {
      return {
        ...state,
        ...init(action.attrs || state.initialAttrs)
      };
    }
    default:
      throw new Error(`unrecognized action ${action.type}`);
  }
}

export function init(attrs, config) {
  return {
    initialAttrs: attrs,
    attrs,
    errors: {},
    shouldValidateOnChange: false,
    ...resolveConfig(config)
  };
}

export function setConfig(config) {
  return {type: "setConfig", config};
}

export function setAttr(path, value) {
  return {type: "setAttr", path, value};
}

export function setAttrs(attrs) {
  return {type: "setAttrs", attrs};
}

export function validate(callbacks) {
  return {type: "validate", ...callbacks};
}

export function setError(name, error) {
  return {type: "setError", name, error};
}

export function setErrors(errors) {
  return {type: "setErrors", errors};
}

export function reset(attrs) {
  return {type: "reset", attrs};
}

const CONFIG_PROPS = ["useMemo", "pureHandlers", "validations"];

function isConfig(obj) {
  for (const key in obj) {
    if (CONFIG_PROPS.includes(key)) {
      return true;
    }
  }

  return false;
}

function resolveConfig(config) {
  if (!config) return {};

  if (!isConfig(config)) {
    config = {validations: config};
  }

  const validationOptions = {};
  let validations = config.validations || {};

  if ("defaultOptions" in validations) {
    Object.assign(validationOptions, validations.defaultOptions);
    validations = validations.rules;
  }

  return {
    pureHandlers: config.pureHandlers !== false && typeof WeakMap !== "undefined",
    validationOptions,
    validations
  };
}
