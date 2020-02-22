import React, { useCallback } from "react";
import PropTypes from "prop-types";
import { Input } from "../inputs";
import { useOrderForm } from "./orderForm";

ItemForm.propTypes = {
  index: PropTypes.number
};

export default function ItemForm({index}) {
  const {$, set, dropError, attrs: {items}} = useOrderForm();

  const changeItemId = useCallback((value, {name}) => {
    const index = +name.split(".")[1];

    set({
      [name]: value,
      [`items.${index}.count`]: ""
    });
  }, []);

  const removeItem = useCallback(() => {
    const nextItems = [...items];

    nextItems.splice(index, 1);
    set("items", nextItems);
    dropError(`items.${index}.id`);
    dropError(`items.${index}.count`);
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
