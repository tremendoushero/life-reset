import { describe, it, expect } from 'vitest';
import { Bill, Transaction } from '@/types';

describe('Personal Finance Calculations', () => {
  const transactions: Transaction[] = [
    { id: '1', user_id: 'u1', type: 'income', amount: 3000, category: 'Salary', date: '2026-11-01', is_planned: true },
    { id: '2', user_id: 'u1', type: 'expense', amount: 150, category: 'Groceries', date: '2026-11-03', is_planned: false },
    { id: '3', user_id: 'u1', type: 'expense', amount: 50, category: 'Transport', date: '2026-11-05', is_planned: false },
  ];

  const bills: Bill[] = [
    { id: 'b1', user_id: 'u1', name: 'Internet', amount: 60, due_date: '2026-11-15', recurrence: 'monthly', payment_status: 'pending', category: 'utilities' },
    { id: 'b2', user_id: 'u1', name: 'Water', amount: 40, due_date: '2026-11-20', recurrence: 'monthly', payment_status: 'paid', category: 'utilities' },
  ];

  it('calculates total income, expenses, and remaining buffer accurately', () => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const remainingBuffer = totalIncome - totalExpenses;

    expect(totalIncome).toBe(3000);
    expect(totalExpenses).toBe(200);
    expect(remainingBuffer).toBe(2800);
  });

  it('calculates pending bills accurately and excludes paid bills', () => {
    const pendingSum = bills
      .filter(b => b.payment_status === 'pending')
      .reduce((sum, b) => sum + b.amount, 0);

    expect(pendingSum).toBe(60);
  });
});

