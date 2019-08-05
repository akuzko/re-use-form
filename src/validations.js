import get from "get-lookup";

const validationRules = {};

export function defValidation(name, ruleFn) {
  validationRules[name] = ruleFn;
}

export function validateAttr(validations, options, name, value) {
  return callValueValidator(validations, options, name, value);
}

export function validateRule(validations, options, name, attrs, errors) {
  if (name.includes("*")) {
    callEachValidator(validations, options, name, attrs, errors);
  } else {
    const error = callValueValidator(validations, options, name, get(attrs, name));

    if (error) {
      errors[name] = error;
    }
  }
}

function callEachValidator(validations, options, name, attrs, errors) {
  const match = name.match(/^([^*]+)\.\*(.+)?$/);
  const [collectionName, rest = ""] = match.slice(1);

  (get(attrs, collectionName) || []).forEach((_item, i) => {
    validateRule(validations, options, `${collectionName}.${i}${rest}`, attrs, errors);
  });
}

function callValueValidator(validations, options, name, value) {
  const validator = validations[name] || validations[wildcard(name)];

  return callValidator(validator, value, options);
}

function callValidator(validator, value, options) {
  if (Array.isArray(validator)) {
    return callArrayValidator(validator, value, options);
  }
  if (typeof validator === "string") {
    return callStringValidator(validator, value, options);
  }
  if (typeof validator === "function") {
    return validator(value, options);
  }
  if (validator && (typeof validator === "object")) {
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
    const error = callStringValidator(name, value, {...options, ...obj[name]});

    if (error) return error;
  }
}


function stringToValidator(name) {
  const validator = validationRules[name];

  if (!validator) throw new Error(`${name} validation rule is not defined`);

  return validator;
}

function wildcard(name) {
  return name.replace(/\d+/g, "*");
}
