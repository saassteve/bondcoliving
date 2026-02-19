import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Plus, X, Edit, Trash, Check, AlertCircle } from 'lucide-react';
import {
  coworkingPassService,
  coworkingPassScheduleService,
  type CoworkingPass,
  type CoworkingPassAvailabilitySchedule,
} from '../../lib/supabase';

interface PassAvailabilityManagerProps {
  passId: string;
  onClose?: () => void;
}

const PassAvailabilityManager: React.FC<PassAvailabilityManagerProps> = ({ passId, onClose }) => {
  const [pass, setPass] = useState<CoworkingPass | null>(null);
  const [schedules, setSchedules] = useState<CoworkingPassAvailabilitySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'capacity' | 'dates' | 'schedules'>('basic');
  const [editingSchedule, setEditingSchedule] = useState<CoworkingPassAvailabilitySchedule | null>(null);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [passForm, setPassForm] = useState({
    is_capacity_limited: false,
    max_capacity: '',
    is_date_restricted: false,
    available_from: '',
    available_until: '',
  });

  const [scheduleForm, setScheduleForm] = useState({
    schedule_name: '',
    start_date: '',
    end_date: '',
    max_capacity: '',
    priority: '0',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [passId]);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [passData, schedulesData] = await Promise.all([
        coworkingPassService.getById(passId),
        coworkingPassScheduleService.getAll(passId),
      ]);

      if (passData) {
        setPass(passData);
        setPassForm({
          is_capacity_limited: passData.is_capacity_limited,
          max_capacity: passData.max_capacity?.toString() || '',
          is_date_restricted: passData.is_date_restricted,
          available_from: passData.available_from || '',
          available_until: passData.available_until || '',
        });
      }
      setSchedules(schedulesData);
    } catch {
      showFeedback('error', 'Failed to load pass data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePass = async () => {
    if (!pass) return;

    try {
      setSaving(true);
      await coworkingPassService.update(pass.id, {
        is_capacity_limited: passForm.is_capacity_limited,
        max_capacity: passForm.max_capacity ? parseInt(passForm.max_capacity) : null,
        is_date_restricted: passForm.is_date_restricted,
        available_from: passForm.available_from || null,
        available_until: passForm.available_until || null,
      });
      await fetchData();
      showFeedback('success', 'Pass settings saved successfully.');
    } catch {
      showFeedback('error', 'Failed to save pass settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSchedule = async () => {
    try {
      setSaving(true);
      const scheduleData = {
        pass_id: passId,
        schedule_name: scheduleForm.schedule_name,
        start_date: scheduleForm.start_date,
        end_date: scheduleForm.end_date,
        max_capacity: scheduleForm.max_capacity ? parseInt(scheduleForm.max_capacity) : null,
        priority: parseInt(scheduleForm.priority),
        notes: scheduleForm.notes || null,
        is_active: true,
      };

      if (editingSchedule) {
        await coworkingPassScheduleService.update(editingSchedule.id, scheduleData);
      } else {
        await coworkingPassScheduleService.create(scheduleData);
      }

      await fetchData();
      setShowScheduleForm(false);
      setEditingSchedule(null);
      resetScheduleForm();
      showFeedback('success', 'Schedule saved successfully.');
    } catch {
      showFeedback('error', 'Failed to save schedule. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSchedule = (schedule: CoworkingPassAvailabilitySchedule) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      schedule_name: schedule.schedule_name,
      start_date: schedule.start_date,
      end_date: schedule.end_date,
      max_capacity: schedule.max_capacity?.toString() || '',
      priority: schedule.priority.toString(),
      notes: schedule.notes || '',
    });
    setShowScheduleForm(true);
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;

    try {
      await coworkingPassScheduleService.delete(id);
      await fetchData();
      showFeedback('success', 'Schedule deleted successfully.');
    } catch {
      showFeedback('error', 'Failed to delete schedule. Please try again.');
    }
  };

  const handleToggleSchedule = async (schedule: CoworkingPassAvailabilitySchedule) => {
    try {
      await coworkingPassScheduleService.update(schedule.id, { is_active: !schedule.is_active });
      await fetchData();
    } catch {
      showFeedback('error', 'Failed to update schedule status.');
    }
  };

  const resetScheduleForm = () => {
    setScheduleForm({ schedule_name: '', start_date: '', end_date: '', max_capacity: '', priority: '0', notes: '' });
  };

  const handleRecalculateCapacity = async () => {
    if (!window.confirm('This will recalculate capacity based on active bookings. Continue?')) return;

    try {
      setSaving(true);
      await coworkingPassService.recalculateAllCapacities();
      await fetchData();
      showFeedback('success', 'Capacity recalculated successfully.');
    } catch {
      showFeedback('error', 'Failed to recalculate capacity. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-[#C5C5B5]">Loading...</div>
      </div>
    );
  }

  if (!pass) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-red-400">Pass not found</div>
      </div>
    );
  }

  const capacityPercentage = pass.max_capacity
    ? Math.round((pass.current_capacity / pass.max_capacity) * 100)
    : 0;

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#C5C5B5]">{pass.name}</h2>
            <p className="text-sm text-gray-400 mt-1">Manage availability and capacity</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close">
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {feedback && (
          <div className={`mt-4 flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
            feedback.type === 'success'
              ? 'bg-green-500/10 border border-green-500/20 text-green-300'
              : 'bg-red-500/10 border border-red-500/20 text-red-300'
          }`}>
            {feedback.type === 'success'
              ? <Check className="w-4 h-4 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0" />
            }
            {feedback.message}
          </div>
        )}

        <div className="flex items-center gap-4 mt-4 flex-wrap">
          {(['basic', 'capacity', 'dates', 'schedules'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg transition-colors capitalize ${
                activeTab === tab
                  ? 'bg-[#C5C5B5] text-gray-900'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tab === 'capacity' && <Users className="w-4 h-4 inline mr-2" />}
              {tab === 'dates' && <Calendar className="w-4 h-4 inline mr-2" />}
              {tab === 'schedules' && <Clock className="w-4 h-4 inline mr-2" />}
              {tab === 'schedules' ? `Schedules (${schedules.length})` : tab === 'basic' ? 'Basic Info' : tab === 'dates' ? 'Date Restrictions' : 'Capacity'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'basic' && (
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Price</p>
                <p className="text-xl font-bold text-[#C5C5B5]">€{pass.price}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Duration</p>
                <p className="text-xl font-bold text-[#C5C5B5]">{pass.duration_days} days</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'capacity' && (
          <div className="space-y-6">
            <div className="bg-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#C5C5B5]">Current Capacity Status</h3>
                <button onClick={handleRecalculateCapacity} className="text-sm text-blue-400 hover:text-blue-300" disabled={saving}>
                  Recalculate
                </button>
              </div>
              {pass.is_capacity_limited ? (
                <>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">{pass.current_capacity} / {pass.max_capacity || 0} active passes</span>
                      <span className="text-sm font-bold text-[#C5C5B5]">{capacityPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${capacityPercentage >= 90 ? 'bg-red-500' : capacityPercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                  {capacityPercentage >= 90 && (
                    <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-300">This pass is at or near capacity.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4 text-gray-400">Capacity limiting is disabled for this pass</div>
              )}
            </div>

            <div className="bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-[#C5C5B5] mb-4">Capacity Settings</h3>
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={passForm.is_capacity_limited} onChange={(e) => setPassForm({ ...passForm, is_capacity_limited: e.target.checked })} className="w-5 h-5 rounded" />
                  <span className="text-[#C5C5B5]">Enable capacity limiting</span>
                </label>
                {passForm.is_capacity_limited && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Maximum Concurrent Passes</label>
                    <input type="number" min="1" value={passForm.max_capacity} onChange={(e) => setPassForm({ ...passForm, max_capacity: e.target.value })} className="input w-full" placeholder="e.g., 10" />
                    <p className="text-sm text-gray-400 mt-1">Maximum number of this pass type that can be active at once</p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={handleSavePass} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Capacity Settings'}</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dates' && (
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-[#C5C5B5] mb-4">Date Restrictions</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={passForm.is_date_restricted} onChange={(e) => setPassForm({ ...passForm, is_date_restricted: e.target.checked })} className="w-5 h-5 rounded" />
                <span className="text-[#C5C5B5]">Enable date restrictions</span>
              </label>
              {passForm.is_date_restricted && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Available From (Optional)</label>
                    <input type="date" value={passForm.available_from} onChange={(e) => setPassForm({ ...passForm, available_from: e.target.value })} className="input w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Available Until (Optional)</label>
                    <input type="date" value={passForm.available_until} onChange={(e) => setPassForm({ ...passForm, available_until: e.target.value })} className="input w-full" />
                  </div>
                  {passForm.available_from && passForm.available_until && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-sm text-blue-300">
                        Pass will be available from {new Date(passForm.available_from).toLocaleDateString()} to {new Date(passForm.available_until).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={handleSavePass} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Date Settings'}</button>
            </div>
          </div>
        )}

        {activeTab === 'schedules' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#C5C5B5]">Availability Schedules</h3>
                <p className="text-sm text-gray-400 mt-1">Create complex availability patterns for this pass</p>
              </div>
              <button onClick={() => { setShowScheduleForm(true); setEditingSchedule(null); resetScheduleForm(); }} className="btn-primary">
                <Plus className="w-4 h-4 inline mr-2" />
                Add Schedule
              </button>
            </div>

            {showScheduleForm && (
              <div className="bg-gray-700 rounded-lg p-6 border-2 border-[#C5C5B5]">
                <h4 className="text-lg font-bold text-[#C5C5B5] mb-4">{editingSchedule ? 'Edit Schedule' : 'New Schedule'}</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Schedule Name *</label>
                    <input type="text" value={scheduleForm.schedule_name} onChange={(e) => setScheduleForm({ ...scheduleForm, schedule_name: e.target.value })} className="input w-full" placeholder="e.g., Summer 2025" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Start Date *</label>
                      <input type="date" value={scheduleForm.start_date} onChange={(e) => setScheduleForm({ ...scheduleForm, start_date: e.target.value })} className="input w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">End Date *</label>
                      <input type="date" value={scheduleForm.end_date} onChange={(e) => setScheduleForm({ ...scheduleForm, end_date: e.target.value })} className="input w-full" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Max Capacity (Optional)</label>
                      <input type="number" min="1" value={scheduleForm.max_capacity} onChange={(e) => setScheduleForm({ ...scheduleForm, max_capacity: e.target.value })} className="input w-full" placeholder="Override pass capacity" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                      <input type="number" value={scheduleForm.priority} onChange={(e) => setScheduleForm({ ...scheduleForm, priority: e.target.value })} className="input w-full" placeholder="0" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Notes (Optional)</label>
                    <textarea value={scheduleForm.notes} onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })} rows={3} className="input w-full" placeholder="Internal notes about this schedule" />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => { setShowScheduleForm(false); setEditingSchedule(null); resetScheduleForm(); }} className="btn bg-gray-600 text-white hover:bg-gray-500">Cancel</button>
                  <button onClick={handleSaveSchedule} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Schedule'}</button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {schedules.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No schedules created yet. Add a schedule to manage complex availability patterns.</div>
              ) : (
                schedules.map((schedule) => (
                  <div key={schedule.id} className={`bg-gray-700 rounded-lg p-4 border ${schedule.is_active ? 'border-green-500/30' : 'border-gray-600'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-bold text-[#C5C5B5]">{schedule.schedule_name}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${schedule.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-400'}`}>
                            {schedule.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>{new Date(schedule.start_date).toLocaleDateString()} - {new Date(schedule.end_date).toLocaleDateString()}</span>
                          {schedule.max_capacity && <span className="flex items-center gap-1"><Users className="w-4 h-4" />{schedule.max_capacity}</span>}
                          <span>Priority: {schedule.priority}</span>
                        </div>
                        {schedule.notes && <p className="text-sm text-gray-500 mt-2">{schedule.notes}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleToggleSchedule(schedule)} className="p-2 hover:bg-gray-600 rounded" title={schedule.is_active ? 'Deactivate' : 'Activate'}>
                          <Check className={`w-4 h-4 ${schedule.is_active ? 'text-green-400' : 'text-gray-500'}`} />
                        </button>
                        <button onClick={() => handleEditSchedule(schedule)} className="p-2 hover:bg-gray-600 rounded text-blue-400" aria-label="Edit schedule">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteSchedule(schedule.id)} className="p-2 hover:bg-gray-600 rounded text-red-400" aria-label="Delete schedule">
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PassAvailabilityManager;
