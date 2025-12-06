import { Bell } from 'lucide-react';

export default function GuestNotificationsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <Bell className="h-8 w-8 mr-3 text-blue-600" />
          Notifications
        </h1>
        <p className="text-gray-600">Stay updated with your activity</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
        <p className="text-gray-600">You're all caught up!</p>
      </div>
    </div>
  );
}
