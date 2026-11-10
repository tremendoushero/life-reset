import React from 'react';
import { NavLink } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Sparkles, ArrowRight, HeartHandshake, Target, Feather, DollarSign, Briefcase, Home } from 'lucide-react';

export const FeaturesPage: React.FC = () => {
  const modules = [
    { title: 'Adaptive Capacity Engine', desc: 'Switches between Normal, Low-Energy, Overwhelmed, Focus, and Brain Dump modes.', icon: <Sparkles className="w-5 h-5 text-primary" /> },
    { title: 'Tiny-Step Rescue', desc: 'Breaks paralyzing tasks into 2, 5, 10, or 15-minute micro-steps with diagnostic guidance.', icon: <Target className="w-5 h-5 text-sage-dark" /> },
    { title: 'Gentle Restart System', desc: 'One-click reset to pick up effortlessly after days or weeks away without broken streaks.', icon: <HeartHandshake className="w-5 h-5 text-softpeach-dark" /> },
    { title: 'Brain Dump & Thought Capture', desc: 'Frictionless capture without mandatory categorization. Organize later when ready.', icon: <Feather className="w-5 h-5 text-lavender-dark" /> },
    { title: 'Life Admin & Waiting-For Tracker', desc: 'Offload renewals, errands, and pending replies from working memory.', icon: <Briefcase className="w-5 h-5 text-softblue-dark" /> },
    { title: 'Money Hub & Bills', desc: 'Track subscriptions, due dates, emergency funds, and debts with calm clarity.', icon: <DollarSign className="w-5 h-5 text-sage-dark" /> },
    { title: 'Household Routines & Inventory', desc: 'Zone cleaning and pantry supply levels without overwhelming chore schedules.', icon: <Home className="w-5 h-5 text-espresso-700" /> },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-[#EAE3D8] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <NavLink to="/" className="font-serif font-bold text-lg text-espresso-900">
          LIFE RESET
        </NavLink>
        <NavLink to="/login">
          <Button variant="primary" size="sm">Open App</Button>
        </NavLink>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso-900">
            Features Built for Executive Function
          </h1>
          <p className="text-sm text-espresso-600 max-w-lg mx-auto">
            Every feature in Life Reset is engineered to reduce task friction and eliminate shame.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map((m, idx) => (
            <Card key={idx} className="p-5 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-ivory-100 flex items-center justify-center">
                {m.icon}
              </div>
              <h3 className="font-serif text-lg font-bold text-espresso-900">{m.title}</h3>
              <p className="text-xs text-espresso-600 leading-relaxed">{m.desc}</p>
            </Card>
          ))}
        </div>

        <div className="text-center pt-6">
          <NavLink to="/signup">
            <Button variant="primary" size="lg">Get Life Reset for $19</Button>
          </NavLink>
        </div>
      </main>
    </div>
  );
};

