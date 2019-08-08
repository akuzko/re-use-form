import { defValidation } from "../../src";

defValidation("presence", (value, {t, message}) => {
  if (!value) {
    return message || t("form.validations.cant_be_blank");
  }

  if (Array.isArray(value) && value.length === 0) {
    return t("form.validations.cant_be_blank");
  }
});

defValidation("format", (value, {t, message, pattern}) => {
  if (!value) return;

  if (!pattern.test(value)) {
    return message || t("form.validations.invalid_format");
  }
});
