import React, { useCallback } from "react";
import { Input } from "../inputs";
import ItemForm from "./ItemForm";

import { useForm } from "../../../src";

const initialForm = {
  username: "",
  items: [{}, {}]
};

export default function ComplexForm() {
  const {$, get, set, getError, reset: doReset, validate, usePartial} = useForm({
    initial: initialForm,
    validations: {
      username: {
        presence: true,
        format: {
          pattern: /^[\w\s\d.,]+$/
        },
      },
      items: "presence"
    }
  });

  const items = get("items");

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
          <ItemForm
            key={ i }
            index={ i }
            usePartial={ usePartial }
            onRemove={ () => removeItem(i) }
          />
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
