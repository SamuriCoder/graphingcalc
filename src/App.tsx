import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import Graph from './components/Graph';
import EquationSidebar from './components/EquationInput';
import './App.css';

const App: React.FC = () => {
  const [showIntersections, setShowIntersections] = useState(false);

  return (
    <Provider store={store}>
      <div className="app">
        <header className="app-header">
          <h1>A Graphing Calculator :)</h1>
        </header>
        
        <main className="app-main">
          <div className="sidebar">
            <EquationSidebar
              showIntersections={showIntersections}
              setShowIntersections={setShowIntersections}
            />
          </div>
          
          <div className="graph-container">
            <Graph showIntersections={showIntersections} />
          </div>
        </main>
      </div>
    </Provider>
  );
};

export default App;
