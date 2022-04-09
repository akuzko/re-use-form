import { defValidation } from '../../src';

function defaultT(key) {
  return key.match(/\.([^.]+)$/)[1]
    .replace(/^.|_./g, s => s[1] ? ` ${s[1].toUpperCase()}` : s[0].toUpperCase());
}

defValidation('presence', (value, { t = defaultT, message }) => {
  if (!value) {
    return message || t('form.validations.cant_be_blank');
  }

  if (Array.isArray(value) && value.length === 0) {
    return t('form.validations.cant_be_blank');
  }
});

defValidation('format', (value, { t = defaultT, message, pattern }) => {
  if (!value) return;

  if (!pattern.test(value)) {
    return message || t('form.validations.invalid_format');
  }
});

defValidation('taken', (value, { t = defaultT, message, delay = 1000 }) => {
  if (!value) return;

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (/taken/.test(value)) {
        reject(message || t('form.validations.already_taken'));
      } else {
        resolve();
      }
    }, delay);
  });
});
