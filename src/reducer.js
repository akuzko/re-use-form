import { validateAttr, validateRule, wildcard } from "./validations";
import { resolveConfig, mergeValidations } from "./config";
import update from "update-js";

export default function reducer(state, action) {
  const {attrs, errors, validations, validationOptions, validationDeps} = state;
  const shouldValidateOnChange = Object.values(errors).some(Boolean);

  switch (action.type) {
    case "setConfig": {
      return {...state, ...resolveConfig(action.config)};
    }
    case "addPartialValidations": {
      const nextValidations = {...validations};
      const {prefix, validations: partialValidations} = action;

      for (const key in partialValidations) {
        nextValidations[`${prefix}.${key}`] = partialValidations[key];
      }

      return {...state, validations: nextValidations};
    }
    case "removePartialValidations": {
      const nextValidations = {...validations};
      const {prefix, validations: partialValidations} = action;

      for (const key in partialValidations) {
        delete nextValidations[`${prefix}.${key}`];
      }

      return {...state, validations: nextValidations};
    }
    case "injectValidations": {
      const {validations: toInjectValidations} = action;

      if (!toInjectValidations) return state;

      return {...state, validations: mergeValidations(validations, toInjectValidations)};
    }
    case "ejectValidations": {
      const {validations: toEjectValidations} = action;

      if (!toEjectValidations) return state;

      const nextValidations = {...validations};

      for (const key in toEjectValidations) {
        const toEject = toEjectValidations[key];

        (Array.isArray(toEject) ? toEject : [toEject]).forEach((validator) => {
          if (nextValidations[key] === validator) {
            delete nextValidations[key];
          } else if (key in nextValidations) {
            const index = nextValidations[key].indexOf(validator);
            nextValidations[key].splice(index, 1);
          }
        });
      }

      return {...state, validations: nextValidations};
    }
    case "setAttr": {
      const {path, value} = action;

      if (shouldValidateOnChange || errors[path]) {
        const nextAttrs = update(attrs, path, value);
        const fullOpts = {...validationOptions, attrs: nextAttrs};
        const nextErrors = {[path]: validateAttr(validations, fullOpts, path, value)};
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
          const fullOpts = {...validationOptions, attrs: nextAttrs};
          const depsToValidate = validationDeps[path] || validationDeps[wildcard(path)];

          if (depsToValidate) {
            depsToValidate.forEach(name => validateRule(validations, fullOpts, name, nextErrors));
          }

          nextErrors[path] = validateAttr(validations, fullOpts, path, action.attrs[path]);
        }
      }

      return {...state, attrs: nextAttrs, errors: nextErrors};
    }
    case "validate": {
      const {resolve, reject} = action;
      const nextErrors = {};
      const fullOpts = {...validationOptions, attrs};

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
        errors: nextErrors
      };
    }
    case "validatePath": {
      const {path, resolve, reject} = action;
      const value = attrs[path];
      const fullOpts = {...validationOptions, attrs};
      const error = validateAttr(validations, fullOpts, path, value);

      if (error) {
        reject({[path]: error});
      } else {
        resolve(value);
      }

      return {
        ...state,
        errors: {
          ...errors, [path]: error
        }
      };
    }
    case "setError": {
      const {name, error} = action;

      if (!error && !errors[name]) return state;

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
    ...resolveConfig(config)
  };
}

export function setConfig(config) {
  return {type: "setConfig", config};
}

export function addPartialValidations(prefix, validations) {
  return {type: "addPartialValidations", prefix, validations};
}

export function removePartialValidations(prefix, validations) {
  return {type: "removePartialValidations", prefix, validations};
}

export function injectValidations(validations) {
  return {type: "injectValidations", validations};
}

export function ejectValidations(validations) {
  return {type: "ejectValidations", validations};
}

export function setAttr(path, value) {
  return {type: "setAttr", path, value};
}

export function setAttrs(attrs) {
  return {type: "setAttrs", attrs};
}

export function validate(path, resolve, reject) {
  if (typeof path === "string") {
    return {type: "validatePath", path, resolve, reject};
  } else {
    return {type: "validate", resolve, reject};
  }
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
