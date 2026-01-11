import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ProductionChart } from './ProductionChart';

describe('ProductionChart', () => {
  const mockProductionHistory = [
    { date: '2024-01-15', oilBbl: 3000, oilBblDay: 100 },
    { date: '2024-02-15', oilBbl: 2850, oilBblDay: 95 },
    { date: '2024-03-15', oilBbl: 2700, oilBblDay: 90 },
    { date: '2024-04-15', oilBbl: 2550, oilBblDay: 85 },
    { date: '2024-05-15', oilBbl: 2400, oilBblDay: 80 },
    { date: '2024-06-15', oilBbl: 2250, oilBblDay: 75 },
    { date: '2024-07-15', oilBbl: 2100, oilBblDay: 70 },
    { date: '2024-08-15', oilBbl: 1950, oilBblDay: 65 },
    { date: '2024-09-15', oilBbl: 1800, oilBblDay: 60 },
    { date: '2024-10-15', oilBbl: 1650, oilBblDay: 55 },
  ];

  it('renders ResponsiveContainer component', () => {
    const { container } = render(<ProductionChart history={mockProductionHistory} />);

    const responsiveContainer = container.querySelector('.recharts-responsive-container');
    expect(responsiveContainer).toBeInTheDocument();
  });

  it('renders without crashing with production data', () => {
    const { container } = render(<ProductionChart history={mockProductionHistory} />);

    expect(container.firstChild).toBeTruthy();
  });

  it('renders without crashing with empty history', () => {
    const { container } = render(<ProductionChart history={[]} />);

    expect(container.firstChild).toBeTruthy();
  });

  it('handles unsorted date data', () => {
    const unsortedHistory = [
      { date: '2024-03-15', oilBbl: 2700, oilBblDay: 90 },
      { date: '2024-01-15', oilBbl: 3000, oilBblDay: 100 },
      { date: '2024-02-15', oilBbl: 2850, oilBblDay: 95 },
    ];

    const { container } = render(<ProductionChart history={unsortedHistory} />);

    expect(container.firstChild).toBeTruthy();
  });
});
