import { validateAttr, validateRule, wildcard } from './validations';
import { resolveConfig, mergeConfigs } from './config';
import update from 'update-js';
import get from 'get-lookup';

export default function reducer(state, action) {
  const { attrs, errors, validations, validationOptions, validationDeps, configs } = state;
  const shouldValidateOnChange = Object.values(errors).some(Boolean);

  switch (action.type) {
    case 'addConfig': {
      if (!action.resolvedConfig) return state;

      const nextConfigs = [...configs, action.resolvedConfig];
      const { validations, validationOptions, validationDeps, helpers } = nextConfigs.reduce(mergeConfigs);
      let nextErrors = errors;

      if (shouldValidateOnChange) {
        const fullOpts = { ...validationOptions, attrs };
        nextErrors = {};

        Object.keys(validations).forEach((rule) => {
          validateRule(validations, fullOpts, rule, nextErrors);
        });
      }

      return {
        ...state,
        configs: nextConfigs,
        errors: nextErrors,
        validations,
        validationOptions,
        validationDeps,
        helpers,
        action
      };
    }
    case 'removeConfig': {
      if (!action.resolvedConfig) return state;

      const index = configs.indexOf(action.resolvedConfig);
      const nextConfigs = [...configs];
      nextConfigs.splice(index, 1);
      const { validations, validationOptions, validationDeps, helpers } = nextConfigs.reduce(mergeConfigs);
      let nextErrors = errors;

      if (shouldValidateOnChange) {
        const fullOpts = { ...validationOptions, attrs };
        nextErrors = {};

        Object.keys(validations).forEach((rule) => {
          validateRule(validations, fullOpts, rule, nextErrors);
        });
      }

      return {
        ...state,
        configs: nextConfigs,
        errors: nextErrors,
        validations,
        validationOptions,
        validationDeps,
        helpers,
        action
      };
    }
    case 'amendInitialConfig': {
      if (!action.resolvedConfig) return state;

      const nextConfigs = [...configs];
      nextConfigs[0] = mergeConfigs(nextConfigs[0], action.resolvedConfig);
      nextConfigs[0].helpers = action.resolvedConfig.helpers;
      const { validations, validationOptions, validationDeps, helpers } = nextConfigs.reduce(mergeConfigs);

      return {
        ...state,
        configs: nextConfigs,
        validations,
        validationOptions,
        validationDeps,
        helpers,
        action
      };
    }
    case 'setAttr': {
      const { path, value } = action;

      if (shouldValidateOnChange || errors[path]) {
        const nextAttrs = update(attrs, path, value);
        const fullOpts = { ...validationOptions, attrs: nextAttrs };
        const nextErrors = { [path]: validateAttr(validations, fullOpts, path, value) };
        const depsToValidate = validationDeps[path] || validationDeps[wildcard(path)];

        if (depsToValidate) {
          depsToValidate.forEach(name => validateRule(validations, fullOpts, name, nextErrors));
        }

        if (Array.isArray(value)) {
          Object.keys(validations).forEach((rule) => {
            if (rule !== path && rule.startsWith(path)) {
              validateRule(validations, fullOpts, rule, nextErrors);
            }
          });
        }

        return {
          ...state,
          attrs: nextAttrs,
          errors: {
            ...errors,
            ...nextErrors
          },
          isPristine: false,
          action
        };
      } else {
        return update(state, { [`attrs.${path}`]: value, isPristine: false, action });
      }
    }
    case 'setAttrs': {
      const nextAttrs = { ...attrs };
      const nextErrors = shouldValidateOnChange ? { ...errors } : errors;
      const actionAttrs = typeof action.attrs === 'function' ? action.attrs(attrs) : action.attrs;

      for (const path in actionAttrs) {
        update.in(nextAttrs, path, actionAttrs[path]);

        if (shouldValidateOnChange) {
          const fullOpts = { ...validationOptions, attrs: nextAttrs };
          const depsToValidate = validationDeps[path] || validationDeps[wildcard(path)];

          if (depsToValidate) {
            depsToValidate.forEach(name => validateRule(validations, fullOpts, name, nextErrors));
          }

          nextErrors[path] = validateAttr(validations, fullOpts, path, actionAttrs[path]);
        }
      }

      return { ...state, attrs: nextAttrs, errors: nextErrors, isPristine: false, action };
    }
    case 'setFullAttrs': {
      const { attrs } = action;

      if (shouldValidateOnChange) {
        // When all attributes are set at once and validation should be
        // executed on set, run all validation routines.
        const nextErrors = {};
        const fullOpts = { ...validationOptions, attrs };

        Object.keys(validations).forEach((rule) => {
          validateRule(validations, fullOpts, rule, nextErrors);
        });

        return { ...state, attrs, errors: nextErrors, isPristine: false, action };
      }

      return { ...state, attrs, isPristine: false, action };
    }
    case 'validate': {
      const { resolve, reject } = action;
      const nextErrors = {};
      const fullOpts = { ...validationOptions, attrs };

      Object.keys(validations).forEach((rule) => {
        validateRule(validations, fullOpts, rule, nextErrors);
      });

      const isValid = !Object.values(nextErrors).some(Boolean);

      if (isValid) {
        resolve(attrs);
      } else {
        reject(nextErrors);
      }

      return {
        ...state,
        errors: nextErrors,
        action
      };
    }
    case 'validatePath': {
      const { path, resolve, reject } = action;
      const value = get(attrs, path);
      const fullOpts = { ...validationOptions, attrs };
      const error = validateAttr(validations, fullOpts, path, value);

      if (error) {
        reject({ [path]: error });
      } else {
        resolve(value);
      }

      return {
        ...state,
        errors: {
          ...errors, [path]: error
        },
        action
      };
    }
    case 'setError': {
      const { name, error } = action;

      if (!error && !errors[name]) return state;

      return { ...state, errors: { ...state.errors, [name]: error, action } };
    }
    case 'setErrors': {
      return { ...state, errors: action.errors, action };
    }
    case 'reset': {
      return {
        ...state,
        errors: {},
        attrs: action.attrs || state.initialAttrs,
        isPristine: true,
        action
      };
    }
    default:
      throw new Error(`unrecognized action ${action.type}`);
  }
}

export function init(config, secondaryConfig) {
  const resolved = resolveConfig(config);
  const { attrs, ...rest } = resolved;
  const fullConfig = secondaryConfig ? mergeConfigs(rest, secondaryConfig) : rest;

  return {
    initialAttrs: attrs,
    attrs,
    errors: {},
    configs: [fullConfig],
    isPristine: true,
    ...fullConfig
  };
}

export function addConfig(resolvedConfig) {
  return { type: 'addConfig', resolvedConfig };
}

export function removeConfig(resolvedConfig) {
  return { type: 'removeConfig', resolvedConfig };
}

export function amendInitialConfig(resolvedConfig) {
  return { type: 'amendInitialConfig', resolvedConfig };
}

export function setAttr(path, value) {
  return { type: 'setAttr', path, value, isAttrUpdate: true };
}

export function setAttrs(attrs) {
  return { type: 'setAttrs', attrs, isAttrUpdate: true };
}

export function setFullAttrs(attrs) {
  return { type: 'setFullAttrs', attrs };
}

export function validate(path, resolve, reject) {
  if (typeof path === 'string') {
    return { type: 'validatePath', path, resolve, reject };
  } else {
    return { type: 'validate', resolve, reject };
  }
}

export function setError(name, error) {
  return { type: 'setError', name, error };
}

export function setErrors(errors) {
  return { type: 'setErrors', errors };
}

export function reset(attrs) {
  return { type: 'reset', attrs, isAttrUpdate: true };
}
