import React, { useState } from "react";

import MonoForm from "./MonoForm";
import ComplexForm from "./ComplexForm";

export default function Main() {
  const [currentTab, setCurrentTab] = useState("mono");

  return (
    <div>
      <div className="tabs">
        <div className="tab" onClick={ () => setCurrentTab("mono") }>Mono Form</div>
        <div className="tab" onClick={ () => setCurrentTab("complex") }>ComplexForm</div>
      </div>

      <div className="panel">
        { renderTab(currentTab) }
      </div>
    </div>
  );
}

function renderTab(tab) {
  switch (tab) {
    case "mono":    return <MonoForm />;
    case "complex": return <ComplexForm />;
  }
}