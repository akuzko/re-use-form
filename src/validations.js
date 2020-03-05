import get from 'get-lookup';

const validationRules = {};

export function defValidation(name, ruleFn) {
  validationRules[name] = ruleFn;
}

export function validateAttr(validations, options, name, value) {
  return callValueValidator(validations, options, name, value);
}

export function validateRule(validations, options, name, errors) {
  if (name.includes('*')) {
    callEachValidator(validations, options, name, errors);
  } else {
    errors[name] = callValueValidator(validations, options, name, get(options.attrs, name));
  }
}

function callEachValidator(validations, options, name, errors) {
  const match = name.match(/^([^*]+)\.\*(.+)?$/);
  const [collectionName, rest = ''] = match.slice(1);

  (get(options.attrs, collectionName) || []).forEach((_item, i) => {
    validateRule(validations, options, `${collectionName}.${i}${rest}`, errors);
  });
}

function callValueValidator(validations, options, name, value) {
  const validator = validations[name] || validations[wildcard(name)];

  return callValidator(validator, value, { ...options, name });
}

function callValidator(validator, value, options) {
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

export function wildcard(name) {
  return name.replace(/\d+/g, '*');
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
