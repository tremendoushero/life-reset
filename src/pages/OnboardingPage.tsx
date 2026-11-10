import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCapacity } from '@/contexts/CapacityContext';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Sparkles, ArrowRight, CheckCircle2, HeartHandshake } from 'lucide-react';
import { EnergyLevel, PlanningTime } from '@/types';

export const OnboardingPage: React.FC = () => {
  const { updateProfile } = useAuth();
  const { setEnergy } = useCapacity();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  // Questionnaire responses
  const [organiseFirst, setOrganiseFirst] = useState('daily_tasks');
  const [planningHurdle, setPlanningHurdle] = useState('decision_paralysis');
  const [preferredTime, setPreferredTime] = useState<PlanningTime>('morning');
  const [currentCapacity, setCurrentCapacity] = useState<EnergyLevel>('steady');

  const handleFinish = async () => {
    setEnergy(currentCapacity);
    await updateProfile({
      onboarding_completed: true,
      planning_capacity: currentCapacity,
      preferred_planning_time: preferredTime,
    });
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-xl space-y-6 animate-fade-in">
        {/* Progress indicator */}
        <div className="flex items-center justify-between text-xs text-espresso-400">
          <span className="font-semibold uppercase tracking-wider text-primary">
            Step {step} of 4
          </span>
          <button
            onClick={handleFinish}
            className="text-espresso-500 hover:text-espresso-800 underline"
          >
            Skip for now
          </button>
        </div>

        {/* STEP 1: What to organise first */}
        {step === 1 && (
          <Card className="p-6 space-y-5 animate-slide-up">
            <div>
              <span className="text-xs font-semibold uppercase text-primary tracking-wider">
                Welcome to Life Reset
              </span>
              <h2 className="font-serif text-2xl font-bold text-espresso-900 dark:text-ivory-50 mt-1">
                What would you like to bring calm to first?
              </h2>
              <p className="text-xs text-espresso-500 mt-1">
                We'll prioritize this in your workspace so you don't feel overwhelmed.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { id: 'daily_tasks', title: 'Daily Overwhelm & Tasks', desc: 'Prioritizing without guilt' },
                { id: 'life_admin', title: 'Life Admin & Follow-ups', desc: 'Renewals, appointments, errands' },
                { id: 'habits', title: 'Routines & Wellness', desc: 'Consistent gentle momentum' },
                { id: 'brain_dump', title: 'Mental Clutter', desc: 'Distraction-free thought capture' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setOrganiseFirst(opt.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    organiseFirst === opt.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30 shadow-soft-sm'
                      : 'border-ivory-300 dark:border-espresso-700 hover:border-ivory-400'
                  }`}
                >
                  <p className="font-semibold text-xs text-espresso-900 dark:text-ivory-100">
                    {opt.title}
                  </p>
                  <p className="text-[11px] text-espresso-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-ivory-200">
              <Button
                variant="primary"
                onClick={() => setStep(2)}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Next Step
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 2: Planning hurdles */}
        {step === 2 && (
          <Card className="p-6 space-y-5 animate-slide-up">
            <div>
              <span className="text-xs font-semibold uppercase text-primary tracking-wider">
                Self-Compassion
              </span>
              <h2 className="font-serif text-2xl font-bold text-espresso-900 dark:text-ivory-50 mt-1">
                What usually makes planning difficult for you?
              </h2>
              <p className="text-xs text-espresso-500 mt-1">
                Life Reset is specifically built around these friction points.
              </p>
            </div>

            <div className="space-y-2">
              {[
                { id: 'decision_paralysis', text: 'Too many tasks at once; I freeze and do nothing' },
                { id: 'shame_missed_days', text: 'Falling behind for a few days makes me abandon the whole system' },
                { id: 'time_blindness', text: 'I underestimate how long tasks take or forget about them' },
                { id: 'energy_fluctuation', text: 'Some days I have zero bandwidth and high-pressure lists stress me out' },
              ].map(hurdle => (
                <button
                  key={hurdle.id}
                  onClick={() => setPlanningHurdle(hurdle.id)}
                  className={`w-full p-3 rounded-xl border text-left text-xs transition-all ${
                    planningHurdle === hurdle.id
                      ? 'border-primary bg-primary/5 font-semibold text-espresso-900 dark:text-ivory-100'
                      : 'border-ivory-300 text-espresso-700 hover:bg-ivory-100'
                  }`}
                >
                  {hurdle.text}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-ivory-200">
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                variant="primary"
                onClick={() => setStep(3)}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Next Step
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 3: Preferred time */}
        {step === 3 && (
          <Card className="p-6 space-y-5 animate-slide-up">
            <div>
              <span className="text-xs font-semibold uppercase text-primary tracking-wider">
                Your Rhythm
              </span>
              <h2 className="font-serif text-2xl font-bold text-espresso-900 dark:text-ivory-50 mt-1">
                What time of day do you prefer checking in?
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'morning', label: 'Morning Calm', desc: 'Set top priorities over tea/coffee' },
                { id: 'afternoon', label: 'Mid-Day Check', desc: 'Recalibrate around lunch' },
                { id: 'evening', label: 'Evening Wind-Down', desc: 'Prep tomorrow before sleep' },
                { id: 'anytime', label: 'Whenever I Feel Like It', desc: 'Zero schedule expectations' },
              ].map(slot => (
                <button
                  key={slot.id}
                  onClick={() => setPreferredTime(slot.id as any)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    preferredTime === slot.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                      : 'border-ivory-300 hover:border-ivory-400'
                  }`}
                >
                  <p className="font-semibold text-xs text-espresso-900">{slot.label}</p>
                  <p className="text-[11px] text-espresso-500 mt-0.5">{slot.desc}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-ivory-200">
              <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                variant="primary"
                onClick={() => setStep(4)}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Next Step
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 4: Capacity check */}
        {step === 4 && (
          <Card className="p-6 space-y-5 animate-slide-up">
            <div>
              <span className="text-xs font-semibold uppercase text-primary tracking-wider">
                Current Bandwidth
              </span>
              <h2 className="font-serif text-2xl font-bold text-espresso-900 dark:text-ivory-50 mt-1">
                How is your energy right now?
              </h2>
              <p className="text-xs text-espresso-500 mt-1">
                Your dashboard adapts immediately. If you're tired, we won't show heavy lists.
              </p>
            </div>

            <div className="grid grid-cols-5 gap-2 text-center">
              {[
                { level: 'empty', label: 'Empty' },
                { level: 'low', label: 'Low' },
                { level: 'steady', label: 'Steady' },
                { level: 'high', label: 'High' },
                { level: 'full', label: 'Full' },
              ].map(opt => (
                <button
                  key={opt.level}
                  onClick={() => setCurrentCapacity(opt.level as any)}
                  className={`py-3 px-1 rounded-xl border text-xs font-semibold transition-all ${
                    currentCapacity === opt.level
                      ? 'bg-primary text-white border-primary shadow-soft-sm'
                      : 'bg-cardwhite border-ivory-300 text-espresso-700 hover:bg-ivory-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-ivory-200">
              <Button variant="ghost" size="sm" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleFinish}
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                Enter My Space
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

