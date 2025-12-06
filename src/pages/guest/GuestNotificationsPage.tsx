import { Bell } from 'lucide-react';

export default function GuestNotificationsPage() {
  return (
    <div className="min-h-screen bg-[#1E1F1E]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <Bell className="h-8 w-8 mr-3 text-[#C5C5B5]" />
            Notifications
          </h1>
          <p className="text-[#C5C5B5]/80">Stay updated with your activity</p>
        </div>

        <div className="bg-[#C5C5B5]/5 border border-[#C5C5B5]/20 rounded-2xl p-12 text-center backdrop-blur-sm">
          <Bell className="h-16 w-16 text-[#C5C5B5]/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No notifications</h3>
          <p className="text-[#C5C5B5]/60">You're all caught up!</p>
        </div>
      </div>
    </div>
  );
}
