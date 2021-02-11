import get from 'get-lookup';

const validationRules = {};

export function defValidation(name, ruleFn) {
  validationRules[name] = ruleFn;
}

export function validateAttr(validations, options, name, value, justDropError) {
  return callValueValidator(validations, options, name, value, justDropError);
}

export function validateRule(validations, options, name, errors, justDropError) {
  if (name.includes('*')) {
    callEachValidator(validations, options, name, errors, justDropError);
  } else {
    errors[name] = callValueValidator(validations, options, name, get(options.attrs, name), justDropError);
  }
}

function callEachValidator(validations, options, name, errors, justDropError) {
  const match = name.match(/^([^*]+)\.\*(.+)?$/);
  const [collectionName, rest = ''] = match.slice(1);

  (get(options.attrs, collectionName) || []).forEach((_item, i) => {
    validateRule(validations, options, `${collectionName}.${i}${rest}`, errors, justDropError);
  });
}

function callValueValidator(validations, options, name, value, justDropError) {
  const validator = findValidator(validations, name);

  return callValidator(validator, value, { ...options, name }, justDropError);
}

function callValidator(validator, value, options, justDropError) {
  if (justDropError) {
    return null;
  }
  if (Array.isArray(validator)) {
    return callArrayValidator(validator, value, options);
  }
  if (typeof validator === 'string') {
    return callStringValidator(validator, value, options);
  }
  if (typeof validator === 'function') {
    return validator(value, options);
  }
  if (validator && (typeof validator === 'object')) {
    return callObjectValidator(validator, value, options);
  }
}

function callArrayValidator(ary, value, options) {
  for (let i = 0; i < ary.length; i++) {
    const error = callValidator(ary[i], value, options);

    if (error) return error;
  }
}

function callStringValidator(name, value, options) {
  return callValidator(stringToValidator(name), value, options);
}

function callObjectValidator(obj, value, options) {
  for (const name in obj) {
    if (!obj[name]) continue;

    const validatorOpts = typeof obj[name] === 'object' ? obj[name] : {};
    const error = callStringValidator(name, value, { ...options, ...validatorOpts });

    if (error) return error;
  }
}


function stringToValidator(name) {
  const validator = validationRules[name];

  if (!validator) throw new Error(`${name} validation rule is not defined`);

  return validator;
}

function findValidator(validations, name) {
  return Object.entries(validations).reduce((toValidate, [path, validator]) => {
    const pathPattern = escapePath(path).replace(/\\\*/g, '\\d+');

    if (new RegExp(`^${pathPattern}$`).test(name)) {
      toValidate.push(validator);
    }

    return toValidate;
  }, []);
}

export function escapePath(path) {
  return path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function wildcard(name) {
  return name.replace(/\d+/g, '*');
}

export function compact(errorsObject) {
  const errors = {};

  for (const key in errorsObject) {
    if (errorsObject[key]) {
      errors[key] = errorsObject[key];
    }
  }

  return errors;
}

export class ValidationPromise {
  constructor(fn) {
    this.promise = new Promise(fn)
      .then((attrs) => {
        this.success = true;
        return attrs;
      }, (errors) => {
        this.errors = errors;
      });
  }

  then(fn) {
    this.promise = this.promise.then((result) => {
      if (this.success) {
        return fn(result);
      }
    });

    return this;
  }

  catch(fn) {
    this.promise = this.promise.then(() => {
      if (this.errors) {
        fn(this.errors);
      }
    });

    return this;
  }
}
