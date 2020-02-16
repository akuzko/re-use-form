import React, { Fragment, useState, useMemo, useCallback } from "react";
import { Input } from "../inputs";
import { useOrderForm } from "./orderForm";
import ItemForm from "./ItemForm";
import FormControls from "./FormControls";

export default function OrderForm() {
  const {$, get, set, getError} = useOrderForm();

  const items = get("items");

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

  return (
    <Fragment>
      <div className="username">
        <Input { ...$("username") } placeholder="Username" />
      </div>

      { getError("items") &&
        <div>At least one item is required</div>
      }

      <button onClick={ addItem }>Add Item</button>

      { items.map((_item, i) => (
          <ItemForm key={ i } index={ i } onRemove={ () => removeItem(i) } />
        ))
      }

      <FormControls />

      <div>{ JSON.stringify(get()) }</div>
    </Fragment>
  );
}