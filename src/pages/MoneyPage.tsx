import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { DollarSign, CheckCircle2, Clock, Plus, CreditCard, PiggyBank, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';

export const MoneyPage: React.FC = () => {
  const {
    bills,
    toggleBillPaid,
    addBill,
    deleteBill,
    transactions,
    addTransaction,
    savings,
    addSavings,
    updateSavingsAmount,
    debts,
    addDebt,
  } = useData();

  const [activeTab, setActiveTab] = useState<'bills' | 'budget' | 'savings' | 'debt'>('bills');
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);

  // New Bill State
  const [billName, setBillName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billDueDate, setBillDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [billRecurrence, setBillRecurrence] = useState<'monthly' | 'weekly' | 'annually'>('monthly');

  // New Transaction State
  const [txDesc, setTxDesc] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txCategory, setTxCategory] = useState('Groceries');

  // Financial calculations
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalBillsDue = bills
    .filter(b => b.payment_status === 'pending')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const remainingBudget = totalIncome - totalExpenses;

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billName.trim()) return;
    await addBill({
      name: billName.trim(),
      amount: parseFloat(billAmount) || 0,
      due_date: billDueDate,
      recurrence: billRecurrence,
      payment_status: 'pending',
      category: 'utilities',
    });
    setBillName('');
    setBillAmount('');
    setBillModalOpen(false);
  };

  const handleCreateTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txDesc.trim()) return;
    await addTransaction({
      description: txDesc.trim(),
      amount: parseFloat(txAmount) || 0,
      type: txType,
      category: txCategory,
      date: format(new Date(), 'yyyy-MM-dd'),
      is_planned: false,
    });
    setTxDesc('');
    setTxAmount('');
    setTransactionModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900 dark:text-ivory-50">
              Money Hub
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-espresso-500 dark:text-ivory-400 mt-0.5">
            Calm personal finance organisation. Keep bills on track without panic.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTransactionModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Log Transaction
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setBillModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Bill
          </Button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <span className="text-[11px] font-semibold text-espresso-400 uppercase tracking-wider">
            Total Income
          </span>
          <p className="font-serif text-xl font-bold text-sage-dark dark:text-sage-light mt-1">
            ${totalIncome.toFixed(2)}
          </p>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-semibold text-espresso-400 uppercase tracking-wider">
            Total Spending
          </span>
          <p className="font-serif text-xl font-bold text-espresso-800 dark:text-ivory-100 mt-1">
            ${totalExpenses.toFixed(2)}
          </p>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-semibold text-espresso-400 uppercase tracking-wider">
            Remaining Buffer
          </span>
          <p className="font-serif text-xl font-bold text-primary mt-1">
            ${remainingBudget.toFixed(2)}
          </p>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-semibold text-espresso-400 uppercase tracking-wider">
            Pending Bills
          </span>
          <p className="font-serif text-xl font-bold text-softpeach-dark dark:text-softpeach mt-1">
            ${totalBillsDue.toFixed(2)}
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-ivory-300 dark:border-espresso-700 gap-4 text-xs font-semibold pb-1">
        {[
          { id: 'bills', label: `Bills & Subscriptions (${bills.length})` },
          { id: 'budget', label: `Transactions (${transactions.length})` },
          { id: 'savings', label: `Savings Goals (${savings.length})` },
          { id: 'debt', label: `Debt Tracker (${debts.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-espresso-500 hover:text-espresso-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: BILLS */}
      {activeTab === 'bills' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bills.map(bill => {
            const isPaid = bill.payment_status === 'paid';
            const isAuto = bill.payment_status === 'auto_pay';

            return (
              <Card
                key={bill.id}
                className={`p-4 flex items-center justify-between gap-3 ${
                  isPaid ? 'opacity-60 bg-ivory-100/50' : 'bg-cardwhite dark:bg-espresso-800'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                        isPaid
                          ? 'bg-sage-light text-sage-dark'
                          : isAuto
                          ? 'bg-softblue-light text-softblue-dark'
                          : 'bg-softpeach-light text-softpeach-dark'
                      }`}
                    >
                      {bill.payment_status.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-espresso-400 capitalize">
                      {bill.recurrence}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm text-espresso-900 dark:text-ivory-100">
                    {bill.name}
                  </h4>
                  <p className="text-xs text-espresso-500 dark:text-ivory-400 mt-0.5">
                    Due: {bill.due_date}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-serif text-lg font-bold text-espresso-900 dark:text-ivory-50 block">
                    ${bill.amount.toFixed(2)}
                  </span>
                  <button
                    onClick={() => toggleBillPaid(bill.id)}
                    className="mt-1 text-xs text-primary hover:underline font-medium"
                  >
                    {isPaid ? 'Mark as Unpaid' : 'Mark as Paid'}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* TAB 2: TRANSACTIONS / BUDGET */}
      {activeTab === 'budget' && (
        <div className="space-y-3">
          {transactions.map(tx => (
            <Card key={tx.id} className="p-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    tx.type === 'income'
                      ? 'bg-sage-light text-sage-dark'
                      : 'bg-softpeach-light text-softpeach-dark'
                  }`}
                >
                  {tx.type === 'income' ? (
                    <ArrowDownRight className="w-4 h-4" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-espresso-900 dark:text-ivory-100">
                    {tx.description}
                  </h4>
                  <p className="text-[11px] text-espresso-400">
                    {tx.category} • {tx.date}
                  </p>
                </div>
              </div>

              <span
                className={`font-serif text-sm font-bold ${
                  tx.type === 'income' ? 'text-sage-dark' : 'text-espresso-800 dark:text-ivory-200'
                }`}
              >
                {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
              </span>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 3: SAVINGS */}
      {activeTab === 'savings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savings.map(goal => {
            const pct = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));

            return (
              <Card key={goal.id} className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-serif text-base font-bold text-espresso-900 dark:text-ivory-50">
                    {goal.title}
                  </h4>
                  <span className="text-xs font-semibold text-primary">{pct}%</span>
                </div>

                <div className="w-full h-2 bg-ivory-200 dark:bg-espresso-700 rounded-full my-2 overflow-hidden">
                  <div className="h-full bg-sage transition-all duration-300" style={{ width: `${pct}%` }} />
                </div>

                <div className="flex items-center justify-between text-xs text-espresso-600 dark:text-ivory-300 mt-2">
                  <span>Current: ${goal.current_amount.toFixed(2)}</span>
                  <span>Target: ${goal.target_amount.toFixed(2)}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* TAB 4: DEBT */}
      {activeTab === 'debt' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {debts.map(debt => (
            <Card key={debt.id} className="p-5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-serif text-base font-bold text-espresso-900 dark:text-ivory-50">
                  {debt.name}
                </h4>
                {debt.interest_rate && (
                  <span className="text-xs px-2 py-0.5 rounded bg-ivory-200 dark:bg-espresso-700">
                    {debt.interest_rate}% APR
                  </span>
                )}
              </div>

              <div className="my-2">
                <span className="text-xs text-espresso-400">Current Balance:</span>
                <p className="font-serif text-2xl font-bold text-espresso-900 dark:text-ivory-50">
                  ${debt.current_balance.toFixed(2)}
                </p>
              </div>

              {debt.minimum_payment && (
                <p className="text-xs text-espresso-600 dark:text-ivory-300 mt-1">
                  Min payment: ${debt.minimum_payment.toFixed(2)}/mo
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add Bill Modal */}
      <Modal
        isOpen={billModalOpen}
        onClose={() => setBillModalOpen(false)}
        title="Add Recurring Bill"
        description="Never get surprised by auto-renewals or due dates."
      >
        <form onSubmit={handleCreateBill} className="space-y-4">
          <Input
            label="Bill Name *"
            value={billName}
            onChange={e => setBillName(e.target.value)}
            placeholder="e.g. Internet, Spotify, Water bill"
            required
            autoFocus
          />

          <Input
            type="number"
            step="0.01"
            label="Amount ($) *"
            value={billAmount}
            onChange={e => setBillAmount(e.target.value)}
            placeholder="0.00"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              label="Next Due Date"
              value={billDueDate}
              onChange={e => setBillDueDate(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-semibold uppercase text-espresso-600 dark:text-ivory-300 mb-1">
                Recurrence
              </label>
              <select
                value={billRecurrence}
                onChange={e => setBillRecurrence(e.target.value as any)}
                className="w-full text-xs rounded-xl border border-ivory-300 p-2.5 bg-white dark:bg-espresso-900"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-ivory-200">
            <Button type="button" variant="ghost" size="sm" onClick={() => setBillModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Bill
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Transaction Modal */}
      <Modal
        isOpen={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        title="Log Transaction"
        description="Keep tabs on daily spending or income."
      >
        <form onSubmit={handleCreateTx} className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTxType('expense')}
              className={`flex-1 py-1.5 rounded-xl border text-xs font-semibold ${
                txType === 'expense' ? 'bg-espresso-800 text-ivory-50' : 'bg-ivory-100'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setTxType('income')}
              className={`flex-1 py-1.5 rounded-xl border text-xs font-semibold ${
                txType === 'income' ? 'bg-sage text-white' : 'bg-ivory-100'
              }`}
            >
              Income
            </button>
          </div>

          <Input
            label="Description *"
            value={txDesc}
            onChange={e => setTxDesc(e.target.value)}
            placeholder="e.g. Groceries at Trader Joe's"
            required
            autoFocus
          />

          <Input
            type="number"
            step="0.01"
            label="Amount ($) *"
            value={txAmount}
            onChange={e => setTxAmount(e.target.value)}
            placeholder="0.00"
            required
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-ivory-200">
            <Button type="button" variant="ghost" size="sm" onClick={() => setTransactionModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Transaction
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

