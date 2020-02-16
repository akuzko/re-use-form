import React, { useCallback } from "react";
import PropTypes from "prop-types";
import { Input } from "../inputs";
import { useOrderForm } from "./orderForm";

ItemForm.propTypes = {
  index: PropTypes.number
};

export default function ItemForm({index}) {
  const {$, set, attrs: {items}} = useOrderForm();

  const changeItemId = useCallback((key, value) => {
    const index = +key.split(".")[1];

    set({
      [key]: value,
      [`items.${index}.count`]: ""
    });
  }, []);

  const removeItem = useCallback(() => {
    const nextItems = [...items];

    nextItems.splice(index, 1);
    set("items", nextItems);
  }, [items, index]);

  return (
    <div>
      <div>
        <Input { ...$(`items.${index}.id`, changeItemId) } placeholder="Item ID" />
      </div>
      <div>
        <Input { ...$(`items.${index}.count`) } placeholder="Item Count" />
      </div>

      <button onClick={ removeItem }>Remove this Item</button>
    </div>
  );
}
