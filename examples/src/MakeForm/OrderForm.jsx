import React, { Fragment, useCallback } from "react";
import { Input } from "../inputs";
import { useOrderForm } from "./orderForm";
import ItemForm from "./ItemForm";
import FormControls from "./FormControls";

export default function OrderForm() {
  const {$, get, set, getError, attrs: {items}} = useOrderForm();

  const addItem = useCallback(() => {
    set("items", [...items, {}]);
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
          <ItemForm key={ i } index={ i } />
        ))
      }

      <FormControls />

      <div>{ JSON.stringify(get()) }</div>
    </Fragment>
  );
}