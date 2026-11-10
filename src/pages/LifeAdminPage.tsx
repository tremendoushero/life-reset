import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { LifeAdminItem, FollowUpItem } from '@/types';
import {
  Briefcase,
  Hourglass,
  CheckCircle2,
  Calendar,
  Plus,
  AlertCircle,
  FileText,
  RotateCcw,
  UserCheck,
} from 'lucide-react';
import { format, addDays } from 'date-fns';

export const LifeAdminPage: React.FC = () => {
  const {
    lifeAdmin,
    addLifeAdmin,
    updateLifeAdminStatus,
    deleteLifeAdmin,
    followUps,
    addFollowUp,
    updateFollowUpStatus,
    deleteFollowUp,
  } = useData();

  const [activeTab, setActiveTab] = useState<'admin' | 'waiting'>('waiting');
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);

  // New Admin Form State
  const [adminTitle, setAdminTitle] = useState('');
  const [adminCategory, setAdminCategory] = useState<LifeAdminItem['category']>('appointment');
  const [adminDueDate, setAdminDueDate] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  // New Follow-up Form State
  const [fuTitle, setFuTitle] = useState('');
  const [fuPerson, setFuPerson] = useState('');
  const [fuFollowUpDate, setFuFollowUpDate] = useState(format(addDays(new Date(), 3), 'yyyy-MM-dd'));
  const [fuNotes, setFuNotes] = useState('');

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminTitle.trim()) return;
    await addLifeAdmin({
      title: adminTitle.trim(),
      category: adminCategory,
      due_date: adminDueDate || undefined,
      notes: adminNotes.trim() || undefined,
      status: 'pending',
    });
    setAdminTitle('');
    setAdminNotes('');
    setAdminModalOpen(false);
  };

  const handleCreateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fuTitle.trim() || !fuPerson.trim()) return;
    await addFollowUp({
      title: fuTitle.trim(),
      person_or_org: fuPerson.trim(),
      requested_date: format(new Date(), 'yyyy-MM-dd'),
      follow_up_date: fuFollowUpDate,
      status: 'waiting',
      notes: fuNotes.trim() || undefined,
    });
    setFuTitle('');
    setFuPerson('');
    setFuNotes('');
    setFollowUpModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900 dark:text-ivory-50">
              Life Admin Hub
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-espresso-500 dark:text-ivory-400 mt-0.5">
            Never lose track of forms, insurance renewals, errands, or things you're waiting for others to finish.
          </p>
        </div>

        <div className="flex gap-2">
          {activeTab === 'waiting' ? (
            <Button
              variant="primary"
              onClick={() => setFollowUpModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Track "Waiting For"
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => setAdminModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Admin Item
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-ivory-300 dark:border-espresso-700 gap-4 text-xs font-semibold pb-1">
        <button
          onClick={() => setActiveTab('waiting')}
          className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'waiting'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-espresso-500 hover:text-espresso-800'
          }`}
        >
          <Hourglass className="w-4 h-4" />
          <span>Waiting-For & Follow-Ups ({followUps.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'admin'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-espresso-500 hover:text-espresso-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Appointments, Renewals & Errands ({lifeAdmin.length})</span>
        </button>
      </div>

      {/* TAB 1: WAITING-FOR TRACKER (ADHD Goldmine) */}
      {activeTab === 'waiting' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-softblue-light/50 border border-softblue/30 text-xs text-espresso-800 dark:text-ivory-100 flex items-start gap-2.5">
            <UserCheck className="w-4 h-4 text-softblue-dark shrink-0 mt-0.5" />
            <p>
              <strong>ADHD Superpower:</strong> When you hand off a task or ask someone for a reply, record it here immediately. You no longer have to keep the mental thread spinning in your working memory!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {followUps.map(item => {
              const isClosed = item.status === 'closed';

              return (
                <Card
                  key={item.id}
                  className={`p-4 flex flex-col justify-between ${
                    isClosed ? 'opacity-60 bg-ivory-100/50' : 'bg-cardwhite dark:bg-espresso-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-softblue-light text-softblue-dark">
                        Waiting for {item.person_or_org}
                      </span>
                      <span className="text-xs text-espresso-400">
                        Follow-up: {item.follow_up_date}
                      </span>
                    </div>

                    <h4 className="font-semibold text-sm text-espresso-900 dark:text-ivory-100">
                      {item.title}
                    </h4>

                    {item.notes && (
                      <p className="text-xs text-espresso-500 dark:text-ivory-400 mt-1 italic">
                        "{item.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-ivory-200 dark:border-espresso-700 text-xs">
                    <span className="text-espresso-400 text-[11px]">
                      Requested: {item.requested_date}
                    </span>
                    <div className="flex gap-2">
                      {isClosed ? (
                        <button
                          onClick={() => updateFollowUpStatus(item.id, 'waiting')}
                          className="text-xs text-espresso-500 hover:underline"
                        >
                          Reopen
                        </button>
                      ) : (
                        <Button
                          variant="gentle"
                          size="sm"
                          onClick={() => updateFollowUpStatus(item.id, 'closed')}
                          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        >
                          Received / Done
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: GENERAL LIFE ADMIN ITEMS */}
      {activeTab === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lifeAdmin.map(item => {
            const isDone = item.status === 'completed';

            return (
              <Card
                key={item.id}
                className={`p-4 flex flex-col justify-between ${
                  isDone ? 'opacity-60 bg-ivory-100/50' : 'bg-cardwhite dark:bg-espresso-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-ivory-200 text-espresso-700 dark:text-ivory-200">
                      {item.category.replace('_', ' ')}
                    </span>
                    {item.due_date && (
                      <span className="text-xs text-espresso-400">Due: {item.due_date}</span>
                    )}
                  </div>

                  <h4 className="font-semibold text-sm text-espresso-900 dark:text-ivory-100">
                    {item.title}
                  </h4>

                  {item.notes && (
                    <p className="text-xs text-espresso-500 dark:text-ivory-400 mt-1">
                      {item.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-ivory-200 text-xs">
                  <button
                    onClick={() =>
                      updateLifeAdminStatus(item.id, isDone ? 'pending' : 'completed')
                    }
                    className="text-primary hover:underline font-medium"
                  >
                    {isDone ? 'Mark as Pending' : 'Mark Completed'}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Admin Item Modal */}
      <Modal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        title="Add Life Admin Item"
        description="Appointments, renewals, documents, or returns."
      >
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <Input
            label="Item Title *"
            value={adminTitle}
            onChange={e => setAdminTitle(e.target.value)}
            placeholder="e.g. Return winter gloves package, Passport renewal"
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-espresso-600 dark:text-ivory-300 mb-1">
                Category
              </label>
              <select
                value={adminCategory}
                onChange={e => setAdminCategory(e.target.value as any)}
                className="w-full text-xs rounded-xl border border-ivory-300 p-2.5 bg-white dark:bg-espresso-900"
              >
                <option value="appointment">Appointment</option>
                <option value="renewal">Renewal / Expiry</option>
                <option value="document">Important Document</option>
                <option value="insurance">Insurance</option>
                <option value="errand">Errand</option>
                <option value="return_refund">Return or Refund</option>
                <option value="form">Form to Fill</option>
                <option value="general">General</option>
              </select>
            </div>

            <Input
              type="date"
              label="Target Date"
              value={adminDueDate}
              onChange={e => setAdminDueDate(e.target.value)}
            />
          </div>

          <Input
            label="Notes / QR Codes / Account #"
            value={adminNotes}
            onChange={e => setAdminNotes(e.target.value)}
            placeholder="e.g. Parcel locker code is in inbox from Tuesday"
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-ivory-200">
            <Button type="button" variant="ghost" size="sm" onClick={() => setAdminModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Admin Item
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Follow-Up Modal */}
      <Modal
        isOpen={followUpModalOpen}
        onClose={() => setFollowUpModalOpen(false)}
        title="Track a 'Waiting-For' Item"
        description="Release it from your working memory until the follow-up date."
      >
        <form onSubmit={handleCreateFollowUp} className="space-y-4">
          <Input
            label="What are you waiting for? *"
            value={fuTitle}
            onChange={e => setFuTitle(e.target.value)}
            placeholder="e.g. Landlord reply on tap repair, Doctor prescription fax"
            required
            autoFocus
          />

          <Input
            label="Who is responsible? (Person or Organisation) *"
            value={fuPerson}
            onChange={e => setFuPerson(e.target.value)}
            placeholder="e.g. Property Manager, Dr. Evans, Accounting"
            required
          />

          <Input
            type="date"
            label="When should you follow up if no reply?"
            value={fuFollowUpDate}
            onChange={e => setFuFollowUpDate(e.target.value)}
            required
          />

          <Input
            label="Context or phone number (Optional)"
            value={fuNotes}
            onChange={e => setFuNotes(e.target.value)}
            placeholder="e.g. Send SMS if no email received"
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-ivory-200">
            <Button type="button" variant="ghost" size="sm" onClick={() => setFollowUpModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save and Release Thought
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
