import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { getCurrentGuestUser, type GuestUser } from '../../lib/guestAuth';
import { Wrench, Calendar, Check, Sparkles } from 'lucide-react';

interface CleaningPreference {
  id: string;
  preferred_day_of_week: number;
  cleaning_frequency_weeks: number;
  next_cleaning_date: string;
  last_cleaning_date: string | null;
  notes: string | null;
}

interface AvailableDay {
  day_of_week: number;
  day_name: string;
  next_available_date: string;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function GuestServicesPage() {
  const { guestUser } = useOutletContext<{ guestUser: GuestUser | null }>();
  const [cleaningPreference, setCleaningPreference] = useState<CleaningPreference | null>(null);
  const [availableDays, setAvailableDays] = useState<AvailableDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (guestUser && guestUser.user_type === 'overnight') {
      loadCleaningPreference();
      loadAvailableDays();
    } else {
      setLoading(false);
    }
  }, [guestUser]);

  const loadCleaningPreference = async () => {
    if (!guestUser) return;

    const { data, error } = await supabase
      .from('cleaning_preferences')
      .select('*')
      .eq('guest_user_id', guestUser.id)
      .maybeSingle();

    if (data && !error) {
      setCleaningPreference(data);
      setSelectedDay(data.preferred_day_of_week);
    }
  };

  const loadAvailableDays = async () => {
    if (!guestUser) return;

    setLoading(true);

    const { data, error } = await supabase.rpc('get_available_cleaning_days', {
      p_guest_user_id: guestUser.id,
    });

    if (data && !error) {
      setAvailableDays(data);
    }

    setLoading(false);
  };

  const handleSavePreference = async () => {
    if (!guestUser || selectedDay === null) return;

    setSaving(true);
    setSuccess(null);

    try {
      const selectedDayData = availableDays.find(d => d.day_of_week === selectedDay);
      if (!selectedDayData) return;

      if (cleaningPreference) {
        // Update existing preference
        const { error } = await supabase
          .from('cleaning_preferences')
          .update({
            preferred_day_of_week: selectedDay,
            next_cleaning_date: selectedDayData.next_available_date,
          })
          .eq('id', cleaningPreference.id);

        if (error) {
          console.error('Error updating preference:', error);
          alert('Failed to update cleaning preference');
        } else {
          setSuccess('Cleaning preference updated successfully!');
          await loadCleaningPreference();
        }
      } else {
        // Create new preference
        const { error } = await supabase
          .from('cleaning_preferences')
          .insert({
            guest_user_id: guestUser.id,
            preferred_day_of_week: selectedDay,
            cleaning_frequency_weeks: 2,
            next_cleaning_date: selectedDayData.next_available_date,
          });

        if (error) {
          console.error('Error creating preference:', error);
          alert('Failed to save cleaning preference');
        } else {
          setSuccess('Cleaning preference saved successfully!');
          await loadCleaningPreference();
        }
      }

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error:', err);
      alert('An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (guestUser?.user_type !== 'overnight') {
    return (
      <div className="min-h-screen bg-[#1E1F1E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <Wrench className="h-8 w-8 mr-3 text-[#C5C5B5]" />
              Services
            </h1>
            <p className="text-[#C5C5B5]/80">This section is only available for overnight guests</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1E1F1E] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C5C5B5]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1E1F1E]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <Sparkles className="h-8 w-8 mr-3 text-[#C5C5B5]" />
            Cleaning Schedule
          </h1>
          <p className="text-[#C5C5B5]/80">Set your preferred day for bi-weekly cleaning service</p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-900/50 border border-green-700 rounded-lg text-green-200 flex items-center">
            <Check className="h-5 w-5 mr-2" />
            {success}
          </div>
        )}

        {/* Current Preference */}
        {cleaningPreference && (
          <div className="mb-8 bg-gradient-to-br from-[#C5C5B5] to-[#C5C5B5]/80 rounded-2xl shadow-xl p-6 text-[#1E1F1E]">
            <div className="flex items-center mb-4">
              <Calendar className="h-6 w-6 mr-2" />
              <h2 className="text-xl font-bold">Your Current Schedule</h2>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-[#1E1F1E]/70">Preferred Day</p>
                <p className="text-lg font-semibold">{DAYS_OF_WEEK[cleaningPreference.preferred_day_of_week]}</p>
              </div>
              <div>
                <p className="text-sm text-[#1E1F1E]/70">Next Cleaning</p>
                <p className="text-lg font-semibold">{formatDate(cleaningPreference.next_cleaning_date)}</p>
              </div>
              {cleaningPreference.last_cleaning_date && (
                <div>
                  <p className="text-sm text-[#1E1F1E]/70">Last Cleaning</p>
                  <p className="text-lg font-semibold">{formatDate(cleaningPreference.last_cleaning_date)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Select Day */}
        <div className="bg-[#C5C5B5]/5 border border-[#C5C5B5]/20 rounded-2xl p-6 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white mb-4">
            {cleaningPreference ? 'Change Your Cleaning Day' : 'Choose Your Cleaning Day'}
          </h2>
          <p className="text-[#C5C5B5]/80 mb-6">
            Select your preferred day of the week for bi-weekly cleaning. Your apartment will be cleaned every two weeks on this day.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableDays.map((day) => (
              <button
                key={day.day_of_week}
                onClick={() => setSelectedDay(day.day_of_week)}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  selectedDay === day.day_of_week
                    ? 'border-[#C5C5B5] bg-[#C5C5B5]/20 scale-105'
                    : 'border-[#C5C5B5]/20 bg-[#C5C5B5]/5 hover:border-[#C5C5B5]/40 hover:bg-[#C5C5B5]/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">{day.day_name}</h3>
                  {selectedDay === day.day_of_week && (
                    <div className="bg-[#C5C5B5] rounded-full p-1">
                      <Check className="h-4 w-4 text-[#1E1F1E]" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-[#C5C5B5]/70">
                  Next available: {new Date(day.next_available_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-[#C5C5B5]/60">
              <p>Cleaning occurs every 2 weeks on your selected day</p>
              <p>You can change your preference at any time</p>
            </div>
            <button
              onClick={handleSavePreference}
              disabled={saving || selectedDay === null || selectedDay === cleaningPreference?.preferred_day_of_week}
              className="px-6 py-3 bg-[#C5C5B5] text-[#1E1F1E] rounded-lg hover:bg-white transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : cleaningPreference ? 'Update Preference' : 'Save Preference'}
            </button>
          </div>
        </div>

        {/* Information Box */}
        <div className="mt-8 bg-[#C5C5B5]/5 border border-[#C5C5B5]/20 rounded-2xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-3">About Our Cleaning Service</h3>
          <ul className="space-y-2 text-[#C5C5B5]/80 text-sm">
            <li className="flex items-start">
              <Check className="h-5 w-5 mr-2 text-[#C5C5B5] flex-shrink-0 mt-0.5" />
              <span>Professional cleaning every two weeks on your preferred day</span>
            </li>
            <li className="flex items-start">
              <Check className="h-5 w-5 mr-2 text-[#C5C5B5] flex-shrink-0 mt-0.5" />
              <span>Includes bedroom, bathroom, kitchen, and common areas</span>
            </li>
            <li className="flex items-start">
              <Check className="h-5 w-5 mr-2 text-[#C5C5B5] flex-shrink-0 mt-0.5" />
              <span>Fresh linens and towels provided</span>
            </li>
            <li className="flex items-start">
              <Check className="h-5 w-5 mr-2 text-[#C5C5B5] flex-shrink-0 mt-0.5" />
              <span>Cleaning typically takes 1-2 hours - no need to be present</span>
            </li>
            <li className="flex items-start">
              <Check className="h-5 w-5 mr-2 text-[#C5C5B5] flex-shrink-0 mt-0.5" />
              <span>Need additional cleaning? Contact us through the Messages section</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
