import React from "react";
import PropTypes from "prop-types";
import { Input } from "../inputs";

ItemForm.propTypes = {
  index: PropTypes.number,
  usePartial: PropTypes.func,
  onRemove: PropTypes.func
};

export default function ItemForm({index, usePartial, onRemove}) {
  const {$} = usePartial(`items.${index}`, {
    id: "presence",
    count: "presence"
  });

  return (
    <div>
      <div>
        <Input { ...$("id") } placeholder="Item ID" />
      </div>
      <div>
        <Input { ...$("count") } placeholder="Item Count" />
      </div>

      <button onClick={ onRemove }>Remove this Item</button>
    </div>
  );
}
