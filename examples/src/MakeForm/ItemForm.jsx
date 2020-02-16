import React from "react";
import { Input } from "../inputs";
import { useOrderForm } from "./orderForm";

export default function ItemForm({ index, onRemove }) {
  const {$} = useOrderForm();

  return (
    <div>
      <div>
        <Input { ...$(`items.${index}.id`) } placeholder="Item ID" />
      </div>
      <div>
        <Input { ...$(`items.${index}.count`) } placeholder="Item Count" />
      </div>

      <button onClick={ onRemove }>Remove this Item</button>
    </div>
  );
}