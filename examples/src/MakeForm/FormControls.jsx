import React, { useCallback } from "react";
import { useOrderForm } from "./orderForm";

export default function FormControls() {
  const {reset: doReset, validate} = useOrderForm();

  const reset = useCallback(() => doReset(), []);

  return (
    <div>
      <button onClick={ reset }>Reset</button>
      <button onClick={ validate }>Validate</button>
    </div>
  );
}
