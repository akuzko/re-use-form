import React, { useState } from 'react';

import MonoForm from './MonoForm';
import ComplexForm from './ComplexForm';
import MakeForm from './MakeForm';
import ControlledForm from './ControlledForm';

export default function Main() {
  const [currentTab, setCurrentTab] = useState('controlled');

  return (
    <div>
      <div className="tabs">
        <div className="tab" onClick={() => setCurrentTab('mono')}>Mono Form</div>
        <div className="tab" onClick={() => setCurrentTab('complex')}>ComplexForm</div>
        <div className="tab" onClick={() => setCurrentTab('make')}>MakeForm</div>
        <div className="tab" onClick={() => setCurrentTab('controlled')}>ControlledForm</div>
      </div>

      <div className="panel">
        { renderTab(currentTab) }
      </div>
    </div>
  );
}

function renderTab(tab) {
  switch (tab) {
    case 'mono':       return <MonoForm />;
    case 'complex':    return <ComplexForm />;
    case 'make':       return <MakeForm />;
    case 'controlled': return <ControlledForm />;
  }
}
