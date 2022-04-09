export const DEFAULT_CONFIG = { initial: {} };

function isResolved(config) {
  return 'validationDeps' in config;
}

export function resolveConfig(config) {
  if (!config) return {};
  if (isResolved(config)) return config;

  let validationOptions = {};
  let validationsConfig = config.validations ? { ...config.validations } : {};
  let validationStrategy = 'onAnyError';
  let asyncValidationsConfig = {};

  if ('defaultOptions' in validationsConfig) {
    validationOptions = validationsConfig.defaultOptions;
    delete validationsConfig.defaultOptions;
  }

  if ('onChangeStrategy' in validationsConfig) {
    validationStrategy = validationsConfig.onChangeStrategy;
    delete validationsConfig.onChangeStrategy;
  }

  if ('async' in validationsConfig) {
    asyncValidationsConfig = validationsConfig.async;
    delete validationsConfig.async;
  }

  if ('rules' in validationsConfig) {
    validationsConfig = validationsConfig.rules;
  }

  const [validationDeps, validations] = extractValidationDeps(validationsConfig);
  const [asyncValidations, asyncErrorsStrategy] = extractAsyncValidations(asyncValidationsConfig);

  return {
    attrs: config.initial,
    pureHandlers: config.pureHandlers !== false && typeof WeakMap !== 'undefined',
    validationOptions,
    validations,
    validationDeps,
    validationStrategy,
    asyncValidations,
    asyncErrorsStrategy,
    helpers: Array.isArray(config.helpers) ? config.helpers : (config.helpers ? [config.helpers] : [])
  };
}

function extractValidationDeps(validationsConfig) {
  const validations = { ...validationsConfig };
  const inputDeps = {};

  for (const key in validations) {
    if (typeof validations[key] === 'object' &&
        'rules' in validations[key] && 'deps' in validations[key]
    ) {
      validations[key].deps.forEach((dep) => {
        if (!(dep in inputDeps)) {
          inputDeps[dep] = [];
        }
        inputDeps[dep].push(key);
      });
      validations[key] = validations[key].rules;
    }
  }

  return [inputDeps, validations];
}

function extractAsyncValidations(validationsConfig) {
  let validations = { ...validationsConfig };
  let errorsStrategy = 'takeFirst';

  if ('errorsStrategy' in validations) {
    errorsStrategy = validations.errorsStrategy;
    delete validations.errorsStrategy;
  }

  if ('rules' in validations) {
    validations = validations.rules;
  }

  return [validations, errorsStrategy];
}

function mergeValidations(validations1, validations2) {
  return mergeObj(
    validations1,
    validations2,
    (val1, val2) => {
      if (!Array.isArray(val1)) val1 = [val1];
      if (!Array.isArray(val2)) val2 = [val2];

      return [...val1, ...val2];
    }
  );
}

function mergeValidationOptions(opts1, opts2) {
  return mergeObj(
    opts1,
    opts2,
    (_opt1, opt2) => opt2
  );
}

function mergeValidationDeps(deps1, deps2) {
  return mergeObj(
    deps1,
    deps2,
    (deps1, deps2) => [...deps1, ...deps2]
  );
}

export function mergeConfigs(config1, config2) {
  if (!config1) return config2;
  if (!config2) return config1;

  const resConfig1 = resolveConfig(config1);
  const resConfig2 = resolveConfig(config2);

  return {
    pureHandlers: resConfig1.pureHandlers,
    validationOptions: mergeValidationOptions(resConfig1.validationOptions, resConfig2.validationOptions),
    validations: mergeValidations(resConfig1.validations, resConfig2.validations),
    validationDeps: mergeValidationDeps(resConfig1.validationDeps, resConfig2.validationDeps),
    validationStrategy: config2.validationStrategy || config1.validationStrategy,
    asyncValidations: mergeValidations(resConfig1.asyncValidations, resConfig2.asyncValidations),
    asyncErrorsStrategy: config2.asyncErrorsStrategy || config1.asyncErrorsStrategy,
    helpers: [...resConfig1.helpers, ...resConfig2.helpers]
  };
}

function mergeObj(obj1, obj2, resolver) {
  const merged = { ...obj1 };

  for (const key in obj2) {
    if (key in obj1) {
      merged[key] = resolver(obj1[key], obj2[key]);
    } else {
      merged[key] = obj2[key];
    }
  }

  return merged;
}
