import React from "react";
import { FormProvider } from "./orderForm";
import OrderForm from "./OrderForm";

export default function MakeForm() {
  return (
    <FormProvider>
      <OrderForm />
    </FormProvider>
  );
}
