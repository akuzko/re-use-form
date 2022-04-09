import { validateAttr, validateRule, getValidationDeps, escapePath, compact } from './validations';
import { resolveConfig, mergeConfigs } from './config';
import update from 'update-js';
import get from 'get-lookup';

export default function reducer(state, action) {
  const {
    attrs,
    errors,
    validations,
    validationOptions,
    validationDeps,
    validationStrategy,
    asyncValidations,
    asyncErrorsStrategy,
    isValidated,
    configs
  } = state;
  let shouldValidateOnChange = false;
  let justDropError = false;

  if (validationStrategy === 'onAnyError') {
    shouldValidateOnChange = Object.values(errors).some(Boolean);
  } else if (validationStrategy === 'onAfterValidate') {
    shouldValidateOnChange = isValidated;

    if (!isValidated) {
      justDropError = true;
    }
  } else if (validationStrategy === 'none') {
    justDropError = true;
  } else {
    throw new Error(`Invalid validate on change validation strategy '${validationStrategy}'`);
  }

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
        errors: compact(nextErrors),
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
        errors: compact(nextErrors),
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
      const { validations, validationOptions, validationDeps, validationStrategy, helpers } = nextConfigs.reduce(mergeConfigs);

      return {
        ...state,
        configs: nextConfigs,
        validations,
        validationOptions,
        validationDeps,
        validationStrategy,
        helpers,
        action
      };
    }
    case 'setAttr': {
      const { path, value } = action;

      if (shouldValidateOnChange || justDropError) {
        const nextAttrs = update(attrs, path, value);
        const fullOpts = { ...validationOptions, attrs: nextAttrs };
        const nextErrors = { [path]: validateAttr(validations, fullOpts, path, value, justDropError) };
        const depsToValidate = getValidationDeps(validationDeps, path);

        if (depsToValidate.length) {
          depsToValidate.forEach(name => validateRule(validations, fullOpts, name, nextErrors, justDropError));
        }

        if (Array.isArray(value)) {
          Object.keys(validations).forEach((rule) => {
            const escapedPath = escapePath(path);
            const match = rule.match(new RegExp(`^${escapedPath}\\.(\\*|\\d+)`));

            if (match && (match[1] === '*' || get(nextAttrs, `${path}.${match[1]}`) !== undefined)) {
              validateRule(validations, fullOpts, rule, nextErrors, justDropError);
            }
          });
        }

        return {
          ...state,
          attrs: nextAttrs,
          errors: compact({
            ...errors,
            ...nextErrors
          }),
          isPristine: false,
          action
        };
      } else {
        return update(state, { [`attrs.${path}`]: value, isPristine: false, action });
      }
    }
    case 'setAttrs': {
      const { attrs: actionAttrs, prefix } = action;
      const nextAttrs = { ...attrs };
      const nextErrors = shouldValidateOnChange ? { ...errors } : errors;
      const attrsObj = prefix ? get(attrs, prefix) : attrs;
      const actionAttrsObj = typeof actionAttrs === 'function' ? actionAttrs(attrsObj) : actionAttrs;

      for (const path in actionAttrsObj) {
        const fullPath = prefix ? `${prefix}.${path}` : path;

        update.in(nextAttrs, fullPath, actionAttrsObj[path]);

        if (shouldValidateOnChange || justDropError) {
          const fullOpts = { ...validationOptions, attrs: nextAttrs };
          const depsToValidate = getValidationDeps(validationDeps, fullPath);

          if (depsToValidate.length) {
            depsToValidate.forEach(name => validateRule(validations, fullOpts, name, nextErrors, justDropError));
          }

          nextErrors[fullPath] = validateAttr(validations, fullOpts, fullPath, actionAttrsObj[path], justDropError);
        }
      }

      return { ...state, attrs: nextAttrs, errors: compact(nextErrors), isPristine: false, action };
    }
    case 'setFullAttrs': {
      const { attrs, options = {} } = action;

      if (shouldValidateOnChange && options.validate !== false) {
        // When all attributes are set at once and validation should be
        // executed on set, run all validation routines.
        const nextErrors = {};
        const fullOpts = { ...validationOptions, attrs };

        Object.keys(validations).forEach((rule) => {
          validateRule(validations, fullOpts, rule, nextErrors, justDropError);
        });

        return { ...state, attrs, errors: compact(nextErrors), isPristine: false, action };
      }

      return { ...state, attrs, isPristine: false, action };
    }
    case 'validate': {
      const { resolve, reject } = action;
      const nextErrors = {};
      const fullOpts = { ...validationOptions, attrs };

      Object.keys(validations).forEach((ruleName) => {
        validateRule(validations, fullOpts, ruleName, nextErrors);
      });

      const isValid = !Object.values(nextErrors).some(Boolean);

      if (isValid) {
        resolve(attrs);
      } else {
        reject(nextErrors);
      }

      return {
        ...state,
        errors: compact(nextErrors),
        isValidated: true,
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
        errors: compact({
          ...errors, [path]: error
        }),
        action
      };
    }
    case 'validateAsync': {
      const { path, resolve, reject, skipInputs } = action;
      const toValidate = path ? [path] : Object.keys(asyncValidations);
      const fullOpts = { ...validationOptions, attrs };
      let validationPromises = {};

      toValidate.forEach((ruleName) => {
        validateRule(asyncValidations, fullOpts, ruleName, validationPromises, false, true, skipInputs);
      });

      validationPromises = compact(validationPromises);

      const entries = [];
      Object.entries(validationPromises).forEach(([name, promises]) => {
        promises.forEach(p => entries.push([name, p]));
      });

      Promise.allSettled(entries.map(e => e[1]).flat())
        .then((results) => {
          if (results.every(res => res.status === 'fulfilled')) {
            resolve(path ? get(attrs, path) : attrs);
          } else {
            const nextErrors = {};

            results.forEach((res, i) => {
              if (res.status !== 'rejected') return;
              const name = entries[i][0];

              if (!nextErrors[name]) {
                nextErrors[name] = [];
              }
              nextErrors[name].push(res.reason);
            });

            for (const name in nextErrors) {
              if (asyncErrorsStrategy === 'takeFirst') {
                nextErrors[name] = nextErrors[name][0];
              } else if (asyncErrorsStrategy === 'join') {
                nextErrors[name] = nextErrors[name].join('; ');
              } else if (typeof asyncErrorsStrategy === 'function') {
                nextErrors[name] = asyncErrorsStrategy(nextErrors[name]);
              } else {
                throw new Error(`Invalid async errors handling strategy '${asyncErrorsStrategy}'`);
              }
            }

            reject({ ...errors, ...nextErrors });
          }
        });

      return {
        ...state,
        validating: validationPromises,
        action
      };
    }
    case 'finishValidateAsync': {
      const { errors: validationErrors } = action;

      return {
        ...state,
        validating: null,
        errors: {
          ...errors,
          ...validationErrors
        }
      };
    }
    case 'setError': {
      const { name, error } = action;

      if (!error && !errors[name]) return state;

      return { ...state, errors: compact({ ...state.errors, [name]: error, action }) };
    }
    case 'setErrors': {
      return { ...state, errors: compact(action.errors), action };
    }
    case 'reset': {
      const actionAttrs = action.attrs || state.initialAttrs;
      const nextAttrs = typeof actionAttrs === 'function' ? actionAttrs(attrs) : actionAttrs;

      return {
        ...state,
        errors: {},
        attrs: nextAttrs,
        isPristine: true,
        isValidated: false,
        action
      };
    }
    case 'setState': {
      const { setter } = action;
      const nextState = setter(state);

      action.isAttrUpdate = attrs !== nextState.attrs;

      return {
        ...nextState,
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
    isValidated: false,
    validating: null,
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

export function setAttrs(attrs, prefix) {
  return { type: 'setAttrs', attrs, prefix, isAttrUpdate: true };
}

export function setFullAttrs(attrs, options) {
  return { type: 'setFullAttrs', attrs, options };
}

export function validate(path, resolve, reject) {
  if (typeof path === 'string') {
    return { type: 'validatePath', path, resolve, reject };
  } else {
    return { type: 'validate', resolve, reject };
  }
}

export function validateAsync(path, resolve, reject, skipInputs = []) {
  return { type: 'validateAsync', path, resolve, reject, skipInputs };
}

export function finishValidateAsync(errors = {}) {
  return { type: 'finishValidateAsync', errors };
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

export function setState(setter) {
  return { type: 'setState', setter };
}
