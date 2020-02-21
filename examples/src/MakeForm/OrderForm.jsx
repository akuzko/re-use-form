import React, { Fragment, useCallback } from "react";
import { Input, Checkbox } from "../inputs";
import { useOrderForm } from "./orderForm";
import ItemForm from "./ItemForm";
import FormControls from "./FormControls";

export default function OrderForm() {
  const {$, attrs, set, errors, getError, useMoreValidations, attrs: {guest, items}} = useOrderForm();

  useMoreValidations(() => {
    if (!guest) {
      return {
        username: "presence",
        address: "presence"
      };
    }
  }, [guest]);

  const addItem = useCallback(() => {
    set("items", [...items, {}]);
  }, [items]);

  return (
    <Fragment>
      <div className="guest">
        <Checkbox { ...$("guest") } label="Guest" />
      </div>
      <div className="username">
        <Input { ...$("username") } placeholder="Username" />
      </div>
      <div className="address">
        <Input { ...$("address") } placeholder="Address" />
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

      <div>{ JSON.stringify(attrs) }</div>
      <div>{ JSON.stringify(errors) }</div>
    </Fragment>
  );
}
