import get from 'lodash.get';

const config = {
  validations: {}
};

export function defineValidations(hookOrDefinitions, ...rest) {
  if (typeof hookOrDefinitions === 'function') {
    defineTranslatedValidations(...arguments)
  } else {
    definePlainValidations(hookOrDefinitions);
  }
}

function defineTranslatedValidations(i18nHook, ...args) {
  const definitionsFn = args.pop();

  config.i18nHook = i18nHook;
  config.hookArgs = args;
  config.validations = definitionsFn;
}

function definePlainValidations(definitions) {
  if (typeof config.validations !== 'object') {
    config.validations = {};
  }

  Object.assign(config.validations, definitions);
}

export function callRuleValidator(formValidations, errors, name, attributes) {
  if (name.includes('*')) {
    callEachValidator(formValidations, errors, name, attributes);
  } else {
    const error = callValueValidator(formValidations, name, get(attributes, name));

    if (error) {
      errors[name] = error;
    }
  }
}

function callEachValidator(formValidations, errors, name, attributes) {
  const match = name.match(/^([^*]+)\.\*(.+)?$/);
  const [collectionName, rest = ''] = match.slice(1);

  (get(attributes, collectionName) || []).forEach((_item, i) => {
    callRuleValidator(formValidations, errors, `${collectionName}.${i}${rest}`, attributes);
  });
}

export function callValueValidator(formValidations, name, value) {
  const validator = formValidations[name] || formValidations[wildcard(name)];

  return callValidator(validator, value);
}

function callValidator(validator, value) {
  if (Array.isArray(validator)) {
    return callArrayValidator(validator, value);
  }
  if (typeof validator === 'string') {
    return callStringValidator(validator, true, value);
  }
  if (typeof validator === 'function') {
    return validator(value);
  }
  if (validator && (typeof validator === 'object')) {
    return callObjectValidator(validator, value);
  }
}

function stringToValidator(name) {
  const validationsConfig = typeof config.validations === 'function' ?
    config.validations(config.i18nHook(...config.hookArgs)) :
    config.validations;

  const validator = validationsConfig[name];

  if (!validator) throw new Error(`${name} validation rule is not defined`);

  return validator;
}

function callStringValidator(name, options, value) {
  return stringToValidator(name)(value, options === true ? {} : options);
}

function callObjectValidator(obj, value) {
  for (const name in obj) {
    const error = callStringValidator(name, obj[name], value);
    if (error) return error;
  }
}

function callArrayValidator(ary, value) {
  for (let i = 0; i < ary.length; i++) {
    const error = callValidator(ary[i], value);
    if (error) return error;
  }
}

function wildcard(name) {
  return name.replace(/\d+/g, '*');
}
