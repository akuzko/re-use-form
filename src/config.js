const CONFIG_PROPS = ["deps", "pureHandlers", "validations"];

function isConfig(obj) {
  for (const key in obj) {
    if (CONFIG_PROPS.includes(key)) {
      return true;
    }
  }

  return false;
}

function isResolved(config) {
  return "pureHandlers" in config;
}

export function resolveConfig(config) {
  if (!config) return {};
  if (isResolved(config)) return config;

  if (!isConfig(config)) {
    config = {validations: config};
  }

  const validationOptions = {};
  let validationsConfig = config.validations || {};

  if ("defaultOptions" in validationsConfig) {
    Object.assign(validationOptions, validationsConfig.defaultOptions);
    validationsConfig = validationsConfig.rules;
  }

  const [validationDeps, validations] = extractValidationDeps(validationsConfig);

  return {
    pureHandlers: config.pureHandlers !== false && typeof WeakMap !== "undefined",
    validationOptions,
    validations,
    validationDeps
  };
}

function extractValidationDeps(validationsConfig) {
  const validations = {...validationsConfig};
  const inputDeps = {};

  for (const key in validations) {
    if (typeof validations[key] === "object" &&
        "rules" in validations[key] && "deps" in validations[key]
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

export function mergeValidations(validations1, validations2) {
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

export function mergeConfig(config1, config2) {
  if (!config1) return config2;
  if (!config2) return config1;

  const resConfig1 = resolveConfig(config1);
  const resConfig2 = resolveConfig(config2);

  return {
    pureHandlers: resConfig1.pureHandlers,
    validationOptions: mergeObj(
      resConfig1.validationOptions,
      resConfig2.validationOptions,
      (_opt1, opt2) => opt2
    ),
    validations: mergeValidations(resConfig1.validations, resConfig2.validations),
    validationDeps: mergeObj(
      resConfig1.validationDeps,
      resConfig2.validationDeps,
      (deps1, deps2) => [...deps1, ...deps2]
    )
  };
}

function mergeObj(obj1, obj2, resolver) {
  for (const key in obj2) {
    if (key in obj1) {
      obj1[key] = resolver(obj1[key], obj2[key]);
    } else {
      obj1[key] = obj2[key];
    }
  }

  return obj1;
}
