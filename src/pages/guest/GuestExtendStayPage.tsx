import { Clock } from 'lucide-react';

export default function GuestExtendStayPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <Clock className="h-8 w-8 mr-3 text-teal-600" />
          Extend Your Stay
        </h1>
        <p className="text-gray-600">Request to extend your current booking</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Stay Extensions Coming Soon</h3>
        <p className="text-gray-600 mb-6">
          You'll soon be able to request stay extensions directly through the platform with automatic availability checking and pricing.
        </p>
        <p className="text-sm text-gray-500">
          In the meantime, please contact us directly to extend your stay.
        </p>
      </div>
    </div>
  );
}
