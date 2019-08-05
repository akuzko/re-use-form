import React, { useState, useMemo, useCallback } from "react";
import Input from "./Input";
import Checkbox from "./Checkbox";

import { useForm, defValidation } from "../../src";

function useTranslation() {
  return {t};

  function t(key) {
    return key.match(/\.([^.]+)$/)[1]
      .replace(/^.|_./g, s => s[1] ? ` ${s[1].toUpperCase()}` : s[0].toUpperCase());
  }
}

defValidation("presence", (value, {t, message}) => {
  if (!value) {
    return message || t("form.validations.cant_be_blank");
  }

  if (Array.isArray(value) && value.length === 0) {
    return t('form.validations.cant_be_blank');
  }
});

defValidation("format", (value, {t, message, pattern}) => {
  if (!value) return;

  if (!pattern.test(value)) {
    return message || t("form.validations.invalid_format");
  }
});

const initialForm = {
  username: "",
  items: []
};

export default function Form() {
  const [saving, setSaving] = useState(false);
  const [validationEnabled, setValidationEnabled] = useState(true);
  const {t} = useTranslation();
  const {$, get, set, getError, setErrors, withValidation, reset: doReset} = useForm(initialForm, useMemo(() => ({
    useMemo: false,
    validations: validationEnabled && {
      defaultOptions: {t},
      rules: {
        "username": {
          presence: true,
          format: {
            pattern: /^[\w\s\d\.,]+$/
          },
        },
        "items": "presence",
        "items.*.id": "presence",
        "items.*.count": "presence"
      }
    }
  }), [validationEnabled]));

  const items = get("items");

  const changeUsername = useCallback((key, value) => {
    set(key, value.toUpperCase())
  }, []);

  const changeItemId = useCallback((key, value) => {
    const index = +key.split(".")[1];

    set({
      [key]: value,
      [`items.${index}.count`]: ""
    });
  }, []);

  const changeItemCount = useCallback((key, value) => {
    if (isFinite(+value)) {
      set(key, value);
    }
  }, []);

  const addItem = useCallback(() => {
    set("items", [...items, {}]);
  }, [items]);

  const removeItem = useCallback((i) => {
    const nextItems = [...items];

    nextItems.splice(i, 1);
    set("items", nextItems);
  }, [items]);

  const save = useCallback(() => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setErrors({"items.0.count": t("form.validations.not_enough!")});
    }, 2000);
  }, []);

  const submit = useMemo(() => {
    return validationEnabled ? withValidation(save) : save
  }, [validationEnabled, save]);

  const reset = useCallback(() => doReset(), []);

  return (
    <>
      <div>
        <Checkbox value={ validationEnabled } onChange={ setValidationEnabled } label="Client Validation" />
      </div>

      <div>
        <Input { ...$("username", changeUsername) } placeholder="Username" />
      </div>

      { getError("items") &&
        <div>At least one item is required</div>
      }

      <button onClick={ addItem }>Add Item</button>

      { items.map((_item, i) => (
          <div key={ i }>
            <div>
              <Input { ...$(`items.${i}.id`, changeItemId) } placeholder="Item ID" />
            </div>
            <div>
              <Input { ...$(`items.${i}.count`, changeItemCount) } placeholder="Item Count" />
            </div>

            <button onClick={ () => removeItem(i) }>Remove this Item</button>
          </div>
        ))
      }

      { saving &&
        <div>Saving...</div>
      }

      <div>
        <button onClick={ reset }>Reset</button>
        <button onClick={ submit }>Submit</button>
      </div>

      <div>{ JSON.stringify(get()) }</div>
    </>
  );
}
