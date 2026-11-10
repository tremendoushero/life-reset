import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { HouseholdTask, HouseholdInventoryItem } from '@/types';
import { Home, CheckCircle2, Circle, Plus, Package, Phone, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export const HouseholdPage: React.FC = () => {
  const {
    householdTasks,
    toggleHouseholdTask,
    addHouseholdTask,
    householdInventory,
    updateInventoryQuantity,
    addInventoryItem,
  } = useData();

  const [activeTab, setActiveTab] = useState<'chores' | 'inventory' | 'emergency'>('chores');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [invModalOpen, setInvModalOpen] = useState(false);

  // New Chore state
  const [choreTitle, setChoreTitle] = useState('');
  const [choreZone, setChoreZone] = useState<HouseholdTask['zone']>('general');
  const [choreMins, setChoreMins] = useState(10);

  // New Inventory state
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState<HouseholdInventoryItem['category']>('supplies');
  const [itemQty, setItemQty] = useState(1);
  const [itemReorder, setItemReorder] = useState(1);

  const filteredTasks = householdTasks.filter(t =>
    selectedZone === 'all' ? true : t.zone === selectedZone
  );

  const handleCreateChore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!choreTitle.trim()) return;
    await addHouseholdTask({
      title: choreTitle.trim(),
      zone: choreZone,
      frequency: 'weekly',
      estimated_minutes: choreMins,
      is_completed: false,
    });
    setChoreTitle('');
    setTaskModalOpen(false);
  };

  const handleCreateInv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;
    await addInventoryItem({
      item_name: itemName.trim(),
      category: itemCategory,
      quantity: Number(itemQty),
      reorder_level: Number(itemReorder),
    });
    setItemName('');
    setInvModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900 dark:text-ivory-50">
              Household Hub
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-espresso-500 dark:text-ivory-400 mt-0.5">
            Zone cleaning and simple inventory without overwhelm.
          </p>
        </div>

        <div className="flex gap-2">
          {activeTab === 'chores' && (
            <Button
              variant="primary"
              onClick={() => setTaskModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Household Task
            </Button>
          )}
          {activeTab === 'inventory' && (
            <Button
              variant="primary"
              onClick={() => setInvModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Supply / Item
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-ivory-300 dark:border-espresso-700 gap-4 text-xs font-semibold pb-1">
        <button
          onClick={() => setActiveTab('chores')}
          className={`pb-2 border-b-2 transition-colors ${
            activeTab === 'chores'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-espresso-500 hover:text-espresso-800'
          }`}
        >
          Zone Routines & Cleaning ({householdTasks.length})
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-2 border-b-2 transition-colors ${
            activeTab === 'inventory'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-espresso-500 hover:text-espresso-800'
          }`}
        >
          Household Inventory & Supplies ({householdInventory.length})
        </button>
        <button
          onClick={() => setActiveTab('emergency')}
          className={`pb-2 border-b-2 transition-colors ${
            activeTab === 'emergency'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-espresso-500 hover:text-espresso-800'
          }`}
        >
          Emergency Contacts
        </button>
      </div>

      {/* TAB 1: CHORES */}
      {activeTab === 'chores' && (
        <div className="space-y-4">
          {/* Zone filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {['all', 'kitchen', 'bedroom', 'bathroom', 'living_room', 'general'].map(zone => (
              <button
                key={zone}
                onClick={() => setSelectedZone(zone)}
                className={`text-xs px-3 py-1.5 rounded-lg border capitalize transition-colors ${
                  selectedZone === zone
                    ? 'bg-espresso-800 text-ivory-50 border-espresso-900 font-semibold'
                    : 'bg-cardwhite dark:bg-espresso-800 text-espresso-700 dark:text-ivory-200 border-ivory-300 dark:border-espresso-700'
                }`}
              >
                {zone.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredTasks.map(task => (
              <Card
                key={task.id}
                className={`p-3.5 flex items-center justify-between gap-3 ${
                  task.is_completed ? 'opacity-60 bg-ivory-100/50' : 'bg-cardwhite dark:bg-espresso-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleHouseholdTask(task.id)}
                    className="text-espresso-400 hover:text-primary transition-colors shrink-0"
                  >
                    {task.is_completed ? (
                      <CheckCircle2 className="w-5 h-5 text-sage fill-sage-light" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>
                  <div>
                    <h4
                      className={`text-xs font-semibold text-espresso-900 dark:text-ivory-100 ${
                        task.is_completed ? 'line-through text-espresso-400' : ''
                      }`}
                    >
                      {task.title}
                    </h4>
                    <p className="text-[11px] text-espresso-400 capitalize mt-0.5">
                      {task.zone.replace('_', ' ')} • ~{task.estimated_minutes} mins
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {householdInventory.map(item => {
            const isLow = item.quantity <= item.reorder_level;

            return (
              <Card key={item.id} className="p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-ivory-200 text-espresso-600 dark:text-ivory-300">
                      {item.category}
                    </span>
                    {isLow && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Low Stock
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm text-espresso-900 dark:text-ivory-100 mt-1">
                    {item.item_name}
                  </h4>
                  {item.location && (
                    <p className="text-[11px] text-espresso-400 mt-0.5">At: {item.location}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-ivory-200 dark:border-espresso-700">
                  <span className="text-xs text-espresso-500">Qty: {item.quantity}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateInventoryQuantity(item.id, -1)}
                      className="w-6 h-6 rounded border border-ivory-300 flex items-center justify-center text-xs font-bold hover:bg-ivory-100"
                    >
                      -
                    </button>
                    <button
                      onClick={() => updateInventoryQuantity(item.id, 1)}
                      className="w-6 h-6 rounded border border-ivory-300 flex items-center justify-center text-xs font-bold hover:bg-ivory-100"
                    >
                      +
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* TAB 3: EMERGENCY CONTACTS */}
      {activeTab === 'emergency' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
          <Card className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-espresso-900 dark:text-ivory-100">
                Emergency Services
              </h4>
              <p className="text-xs text-espresso-600">Police, Ambulance, Fire: 911 / 999 / 000</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-softblue-light text-softblue-dark flex items-center justify-center font-bold">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-espresso-900 dark:text-ivory-100">
                Landlord / Emergency Maintenance
              </h4>
              <p className="text-xs text-espresso-600">+1 (555) 234-8901 (David)</p>
            </div>
          </Card>
        </div>
      )}

      {/* Modals */}
      <Modal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        title="Add Household Chore"
      >
        <form onSubmit={handleCreateChore} className="space-y-4">
          <Input
            label="Chore Title *"
            value={choreTitle}
            onChange={e => setChoreTitle(e.target.value)}
            placeholder="e.g. Wipe bathroom mirror"
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-espresso-600 mb-1">
                Zone
              </label>
              <select
                value={choreZone}
                onChange={e => setChoreZone(e.target.value as any)}
                className="w-full text-xs rounded-xl border border-ivory-300 p-2.5 bg-white dark:bg-espresso-900"
              >
                <option value="kitchen">Kitchen</option>
                <option value="bedroom">Bedroom</option>
                <option value="bathroom">Bathroom</option>
                <option value="living_room">Living Room</option>
                <option value="general">General Home</option>
              </select>
            </div>

            <Input
              type="number"
              label="Estimated Mins"
              value={choreMins}
              onChange={e => setChoreMins(Number(e.target.value))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-ivory-200">
            <Button type="button" variant="ghost" size="sm" onClick={() => setTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Chore
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={invModalOpen}
        onClose={() => setInvModalOpen(false)}
        title="Track Household Supply"
      >
        <form onSubmit={handleCreateInv} className="space-y-4">
          <Input
            label="Item Name *"
            value={itemName}
            onChange={e => setItemName(e.target.value)}
            placeholder="e.g. Dishwasher Pods, Coffee Beans"
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              label="Current Quantity"
              value={itemQty}
              onChange={e => setItemQty(Number(e.target.value))}
            />
            <Input
              type="number"
              label="Reorder Alert Level"
              value={itemReorder}
              onChange={e => setItemReorder(Number(e.target.value))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-ivory-200">
            <Button type="button" variant="ghost" size="sm" onClick={() => setInvModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Item
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

