import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Calendar, Wrench, CheckCircle2, AlertTriangle, Edit2, Trash2, X } from 'lucide-react';
import { operationsService, apartmentService } from '../../lib/services';
import type { CleaningSchedule, MaintenanceRequest, Task } from '../../lib/services/operations';

type TabType = 'cleanings' | 'maintenance' | 'tasks';

const AdminOperationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('cleanings');
  const [cleanings, setCleanings] = useState<CleaningSchedule[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [apartments, setApartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [apts, cleans, maint, tsks] = await Promise.all([
        apartmentService.getAll(),
        operationsService.getCleaningSchedules(),
        operationsService.getMaintenanceRequests(),
        operationsService.getTasks(),
      ]);
      setApartments(apts);
      setCleanings(cleans);
      setMaintenance(maint);
      setTasks(tsks);
    } catch (error) {
      console.error('Error fetching operations data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type: TabType, id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      if (type === 'cleanings') {
        await operationsService.deleteCleaningSchedule(id);
      } else if (type === 'maintenance') {
        await operationsService.deleteMaintenanceRequest(id);
      } else if (type === 'tasks') {
        await operationsService.deleteTask(id);
      }
      await fetchData();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const handleStatusUpdate = async (type: TabType, id: string, newStatus: string) => {
    try {
      if (type === 'cleanings') {
        await operationsService.updateCleaningSchedule(id, { status: newStatus as any });
      } else if (type === 'maintenance') {
        await operationsService.updateMaintenanceRequest(id, { status: newStatus as any });
      } else if (type === 'tasks') {
        await operationsService.updateTask(id, { status: newStatus as any });
      }
      await fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-900/50 text-red-300 border border-red-700';
      case 'high':
        return 'bg-orange-900/50 text-orange-300 border border-orange-700';
      case 'normal':
        return 'bg-blue-900/50 text-blue-300 border border-blue-700';
      case 'low':
        return 'bg-gray-700/50 text-gray-300 border border-gray-600';
      default:
        return 'bg-gray-700/50 text-gray-300 border border-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'resolved':
      case 'closed':
        return 'bg-green-900/50 text-green-300 border border-green-700';
      case 'in_progress':
        return 'bg-blue-900/50 text-blue-300 border border-blue-700';
      case 'scheduled':
      case 'pending':
      case 'open':
        return 'bg-yellow-900/50 text-yellow-300 border border-yellow-700';
      case 'cancelled':
      case 'on_hold':
        return 'bg-gray-700/50 text-gray-300 border border-gray-600';
      default:
        return 'bg-gray-700/50 text-gray-300 border border-gray-600';
    }
  };

  return (
    <>
      <Helmet>
        <title>Operations Management - Bond Admin</title>
      </Helmet>

      <div className="p-4 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Operations Management</h1>
            <p className="text-gray-300 text-sm sm:text-base">Manage cleaning schedules, maintenance, and tasks</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">New {activeTab === 'cleanings' ? 'Cleaning' : activeTab === 'maintenance' ? 'Request' : 'Task'}</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('cleanings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              activeTab === 'cleanings'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Cleanings ({cleanings.length})
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              activeTab === 'maintenance'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            <Wrench className="w-4 h-4" />
            Maintenance ({maintenance.length})
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              activeTab === 'tasks'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Tasks ({tasks.length})
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {/* Cleanings Tab */}
            {activeTab === 'cleanings' && (
              <div className="space-y-4">
                {cleanings.length === 0 ? (
                  <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
                    <CheckCircle2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No cleaning schedules yet</h3>
                    <p className="text-gray-300 mb-6">Create your first cleaning schedule to get started</p>
                    <button
                      onClick={() => setShowModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                      <Plus className="w-5 h-5" />
                      New Cleaning Schedule
                    </button>
                  </div>
                ) : (
                  cleanings.map((cleaning) => (
                    <div key={cleaning.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-white">
                              {cleaning.apartments?.title || 'Unknown Apartment'}
                            </h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(cleaning.status)}`}>
                              {cleaning.status}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(cleaning.priority)}`}>
                              {cleaning.priority}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-300 mb-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(cleaning.scheduled_date)}
                            </span>
                            {cleaning.assigned_to && (
                              <span>Assigned to: {cleaning.assigned_to}</span>
                            )}
                          </div>
                          {cleaning.notes && (
                            <p className="text-sm text-gray-400">{cleaning.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <select
                            value={cleaning.status}
                            onChange={(e) => handleStatusUpdate('cleanings', cleaning.id, e.target.value)}
                            className="px-2 py-1 text-sm bg-gray-700 border border-gray-600 text-white rounded focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="scheduled">Scheduled</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <button
                            onClick={() => handleDelete('cleanings', cleaning.id)}
                            className="p-2 text-red-400 hover:bg-gray-700 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Maintenance Tab */}
            {activeTab === 'maintenance' && (
              <div className="space-y-4">
                {maintenance.length === 0 ? (
                  <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
                    <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No maintenance requests</h3>
                    <p className="text-gray-300 mb-6">Create a maintenance request to track repairs and issues</p>
                    <button
                      onClick={() => setShowModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                      <Plus className="w-5 h-5" />
                      New Maintenance Request
                    </button>
                  </div>
                ) : (
                  maintenance.map((request) => (
                    <div key={request.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-white">{request.title}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(request.status)}`}>
                              {request.status}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(request.priority)}`}>
                              {request.priority}
                            </span>
                          </div>
                          <div className="text-sm text-gray-300 mb-2">
                            <span className="font-medium">{request.category}</span> •{' '}
                            {request.apartments?.title || request.buildings?.name || 'General'}
                          </div>
                          <p className="text-sm text-gray-400 mb-2">{request.description}</p>
                          {request.estimated_cost && (
                            <div className="text-sm text-gray-300">
                              Estimated cost: €{request.estimated_cost.toFixed(2)}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <select
                            value={request.status}
                            onChange={(e) => handleStatusUpdate('maintenance', request.id, e.target.value)}
                            className="px-2 py-1 text-sm bg-gray-700 border border-gray-600 text-white rounded focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="on_hold">On Hold</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                          <button
                            onClick={() => handleDelete('maintenance', request.id)}
                            className="p-2 text-red-400 hover:bg-gray-700 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
              <div className="space-y-4">
                {tasks.length === 0 ? (
                  <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No tasks yet</h3>
                    <p className="text-gray-300 mb-6">Create a task to organize your work</p>
                    <button
                      onClick={() => setShowModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                      <Plus className="w-5 h-5" />
                      New Task
                    </button>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-white">{task.title}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                          <div className="text-sm text-gray-300 mb-2">
                            <span className="font-medium">{task.task_type.replace('_', ' ')}</span>
                            {task.due_date && (
                              <span> • Due: {formatDate(task.due_date)}</span>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-sm text-gray-400">{task.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusUpdate('tasks', task.id, e.target.value)}
                            className="px-2 py-1 text-sm bg-gray-700 border border-gray-600 text-white rounded focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <button
                            onClick={() => handleDelete('tasks', task.id)}
                            className="p-2 text-red-400 hover:bg-gray-700 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Note: Modal form for creating new items would go here */}
      {/* For brevity, using a simple implementation note */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-lg w-full border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">
                Coming Soon: Create New {activeTab === 'cleanings' ? 'Cleaning' : activeTab === 'maintenance' ? 'Maintenance Request' : 'Task'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-300 mb-6">
              The form to create new {activeTab} items will be implemented here with all necessary fields and validation.
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminOperationsPage;
