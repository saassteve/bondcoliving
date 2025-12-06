import { FileText } from 'lucide-react';

export default function GuestLocalInfoPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <FileText className="h-8 w-8 mr-3 text-teal-600" />
          Local Information
        </h1>
        <p className="text-gray-600">Discover the best of the area</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Local Guides Coming Soon</h3>
        <p className="text-gray-600">
          We're curating the best local recommendations for dining, activities, transport, and more!
        </p>
      </div>
    </div>
  );
}
