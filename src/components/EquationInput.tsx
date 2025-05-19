import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addEquation, removeEquation, updateEquation } from '../store/graphSlice';
import { Equation } from '../types';
import { RootState } from '../store';
import './EquationInput.css';

const colorPalette = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
];

const EquationSidebar: React.FC<{
  showIntersections: boolean;
  setShowIntersections: (v: boolean) => void;
}> = ({ showIntersections, setShowIntersections }) => {
  const [expression, setExpression] = useState('');
  const [type, setType] = useState<'explicit' | 'implicit' | 'polar'>('explicit');
  const [lineWidth, setLineWidth] = useState(2);
  const dispatch = useDispatch();
  const equations = useSelector((state: RootState) => state.graph.equations);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expression.trim()) return;
    // Assign color from palette
    const color = colorPalette[equations.length % colorPalette.length];
    const equation: Equation = {
      id: Date.now().toString(),
      expression: expression.trim(),
      type,
      style: {
        color,
        lineWidth,
      },
      visible: true,
    };
    dispatch(addEquation(equation));
    setExpression('');
  };

  const handleEdit = (id: string, newExpr: string) => {
    const eq = equations.find(e => e.id === id);
    if (!eq) return;
    dispatch(updateEquation({ ...eq, expression: newExpr }));
  };

  return (
    <div className="equation-sidebar">
      <form onSubmit={handleSubmit} className="equation-input">
        <div className="input-group">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'explicit' | 'implicit' | 'polar')}
            className="equation-type"
          >
            <option value="explicit">y = f(x)</option>
            <option value="implicit">f(x,y) = 0</option>
            <option value="polar">r = f(θ)</option>
          </select>
          <input
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            placeholder="Enter equation..."
            className="equation-expression"
          />
          <button type="submit" className="add-equation">
            Add
          </button>
        </div>
      </form>
      <div className="equation-list">
        {equations.map((eq, idx) => (
          <div key={eq.id} className="equation-row">
            <span className="equation-color-dot" style={{ background: eq.style.color }} />
            <input
              className="equation-expression-label"
              value={eq.expression}
              onChange={e => handleEdit(eq.id, e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: '1rem', color: '#222', flex: 1, border: 'none', background: 'transparent', outline: 'none' }}
            />
            <button className="remove-equation" onClick={() => dispatch(removeEquation(eq.id))}>
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="intersection-toggle">
        <label>
          <input
            type="checkbox"
            checked={showIntersections}
            onChange={e => setShowIntersections(e.target.checked)}
          />
          Show Intersections
        </label>
      </div>
    </div>
  );
};

export default EquationSidebar; 