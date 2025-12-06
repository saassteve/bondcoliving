import { Wrench } from 'lucide-react';

export default function GuestServicesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <Wrench className="h-8 w-8 mr-3 text-orange-600" />
          Service Requests
        </h1>
        <p className="text-gray-600">Request maintenance, cleaning, or other services</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <Wrench className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Requests Coming Soon</h3>
        <p className="text-gray-600 mb-6">
          You'll soon be able to submit maintenance requests, cleaning requests, and other service needs directly through the platform.
        </p>
        <p className="text-sm text-gray-500">
          In the meantime, please contact the front desk for any immediate needs.
        </p>
      </div>
    </div>
  );
}
