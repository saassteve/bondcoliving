import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Eye, Check, X, Filter, Download, Mail, Trash2 } from 'lucide-react';
import { applicationService, type Application } from '../../lib/supabase';

const AdminApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    declined: 0,
  });
  
  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const data = await applicationService.getAll();
      setApplications(data);
      
      // Calculate stats
      setStats({
        total: data.length,
        pending: data.filter(app => app.status === 'pending').length,
        approved: data.filter(app => app.status === 'approved').length,
        declined: data.filter(app => app.status === 'declined').length,
      });
    } catch (err) {
      setError('Failed to load applications');
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportApplications = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Arrival Date', 'Departure Date', 'Apartment Preference', 'Status', 'Submitted'],
      ...filteredApplications.map(app => [
        app.name,
        app.email,
        app.phone || '',
        app.arrival_date,
        app.departure_date,
        app.apartment_preference || '',
        app.status,
        formatDate(app.created_at)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bond-applications-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleView = (application: Application) => {
    setSelectedApplication(application);
  };
  
  const handleApprove = async (id: string) => {
    try {
      const updatedApplication = await applicationService.updateStatus(id, 'approved');
      setApplications(applications.map(app => 
        app.id === id ? updatedApplication : app
      ));
      if (selectedApplication && selectedApplication.id === id) {
        setSelectedApplication(updatedApplication);
      }
    } catch (err) {
      console.error('Error approving application:', err);
      alert('Failed to approve application');
    }
  };
  
  const handleDecline = async (id: string) => {
    try {
      const updatedApplication = await applicationService.updateStatus(id, 'declined');
      setApplications(applications.map(app => 
        app.id === id ? updatedApplication : app
      ));
      if (selectedApplication && selectedApplication.id === id) {
        setSelectedApplication(updatedApplication);
      }
    } catch (err) {
      console.error('Error declining application:', err);
      alert('Failed to decline application');
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this application? This action cannot be undone.')) {
      return;
    }
    
    try {
      await applicationService.delete(id);
      setApplications(applications.filter(app => app.id !== id));
      
      // Close modal if the deleted application was being viewed
      if (selectedApplication && selectedApplication.id === id) {
        setSelectedApplication(null);
      }
      
      // Recalculate stats
      const updatedApplications = applications.filter(app => app.id !== id);
      setStats({
        total: updatedApplications.length,
        pending: updatedApplications.filter(app => app.status === 'pending').length,
        approved: updatedApplications.filter(app => app.status === 'approved').length,
        declined: updatedApplications.filter(app => app.status === 'declined').length,
      });
    } catch (err) {
      console.error('Error deleting application:', err);
      alert('Failed to delete application');
    }
  };
  
  const closeModal = () => {
    setSelectedApplication(null);
  };
  
  const filteredApplications = filter === 'all' 
    ? applications 
    : applications.filter(app => app.status === filter);
  
  const statusBadgeClass = (status: string) => {
    switch(status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Applications - Bond Admin</title>
        </Helmet>
        <div className="text-center py-8">Loading applications...</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Helmet>
          <title>Applications - Bond Admin</title>
        </Helmet>
        <div className="text-center py-8 text-red-600">{error}</div>
      </>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>Applications - Bond Admin</title>
      </Helmet>
      
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Applications</h1>
          
          <div className="mt-4 sm:mt-0 flex items-center space-x-4">
            <button
              onClick={exportApplications}
              className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-1" />
              Export CSV
            </button>
            
            <span className="mr-2 text-sm text-gray-600">
              <Filter className="w-4 h-4 inline-block mr-1" />
              Filter:
            </span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="form-select text-sm border-gray-300 rounded-md shadow-sm"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-700 font-medium">Total Applications</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-700 font-medium">Pending Review</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-gray-700 font-medium">Approved</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="text-2xl font-bold text-red-600">{stats.declined}</div>
            <div className="text-sm text-gray-700 font-medium">Declined</div>
          </div>
        </div>
        
        {/* Applications Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Room Preference
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-300">
                {filteredApplications.map((application) => (
                  <tr key={application.id}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{application.name}</div>
                      <div className="text-sm text-gray-600">{application.email}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{formatDate(application.created_at)}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{application.apartment_preference || 'No preference'}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadgeClass(application.status)}`}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleView(application)}
                        className="text-indigo-600 hover:text-indigo-800 mr-2 font-medium"
                      >
                        <Eye className="w-4 h-4 inline-block" />
                      </button>
                      <a
                        href={`mailto:${application.email}`}
                        className="text-blue-600 hover:text-blue-800 mr-2 font-medium"
                        title="Send email"
                      >
                        <Mail className="w-4 h-4 inline-block" />
                      </a>
                      <button
                        onClick={() => handleDelete(application.id)}
                        className="text-red-600 hover:text-red-800 mr-2 font-medium"
                        title="Delete application"
                      >
                        <Trash2 className="w-4 h-4 inline-block" />
                      </button>
                      {application.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(application.id)}
                            className="text-green-600 hover:text-green-800 mr-2 font-medium"
                          >
                            <Check className="w-4 h-4 inline-block" />
                          </button>
                          <button
                            onClick={() => handleDecline(application.id)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            <X className="w-4 h-4 inline-block" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                
                {filteredApplications.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center">
                      <div className="text-gray-400 mb-1">No applications found</div>
                      <div className="text-sm text-gray-500">Try adjusting your filters</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Application Details Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold">Application Details</h2>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-6">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusBadgeClass(selectedApplication.status)}`}>
                  {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Applicant</h3>
                  <p className="font-medium">{selectedApplication.name}</p>
                  <p className="text-gray-600">{selectedApplication.email}</p>
                  {selectedApplication.phone && (
                    <p className="text-gray-600">{selectedApplication.phone}</p>
                  )}
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Submission Date</h3>
                  <p>{formatDate(selectedApplication.created_at)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Room Preference</h3>
                  <p>{selectedApplication.apartment_preference || 'No preference'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Stay Period</h3>
                  <p>{formatDate(selectedApplication.arrival_date)} to {formatDate(selectedApplication.departure_date)}</p>
                </div>

                {selectedApplication.heard_from && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Heard From</h3>
                    <p>{selectedApplication.heard_from}</p>
                  </div>
                )}
              </div>
              
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">About</h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-gray-700">{selectedApplication.about}</p>
                </div>
              </div>
              
              <div className="mb-6 flex items-center space-x-3">
                <a
                  href={`mailto:${selectedApplication.email}?subject=Your Bond Application&body=Hi ${selectedApplication.name},%0D%0A%0D%0AThank you for your application to Bond.%0D%0A%0D%0ABest regards,%0D%0AThe Bond Team`}
                  className="btn bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Mail className="w-4 h-4 mr-1" />
                  Send Email
                </a>
              </div>
              
              {selectedApplication.status === 'pending' && (
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => handleDecline(selectedApplication.id)}
                    className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Decline
                  </button>
                  <button
                    onClick={() => handleApprove(selectedApplication.id)}
                    className="btn-primary"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approve
                  </button>
                </div>
              )}
            </div>
            
            {/* Delete button - always available */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => handleDelete(selectedApplication.id)}
                className="btn bg-red-50 border border-red-300 text-red-700 hover:bg-red-100"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete Application
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminApplicationsPage;