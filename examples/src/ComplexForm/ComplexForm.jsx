import React, { useState, useMemo, useCallback } from "react";
import { Input } from "../inputs";

import { useForm } from "../../../src";

const initialForm = {
  username: "",
  items: [{}, {}, {}]
};

function ItemForm({ usePartial, index, onRemove }) {
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

export default function ComplexForm() {
  const {$, get, set, getError, reset: doReset, validate, usePartial} = useForm(initialForm, {
    username: {
      presence: true,
      format: {
        pattern: /^[\w\s\d\.,]+$/
      },
    },
    items: "presence"
  });

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

  const reset = useCallback(() => doReset(), []);

  return (
    <>
      <div className="username">
        <Input { ...$("username") } placeholder="Username" />
      </div>

      { getError("items") &&
        <div>At least one item is required</div>
      }

      <button onClick={ addItem }>Add Item</button>

      { items.map((_item, i) => (
          <ItemForm key={ i } usePartial={ usePartial } index={ i } onRemove={ () => removeItem(i) } />
        ))
      }

      <div>
        <button onClick={ reset }>Reset</button>
        <button onClick={ validate }>Validate</button>
      </div>

      <div>{ JSON.stringify(get()) }</div>
    </>
  );
}
