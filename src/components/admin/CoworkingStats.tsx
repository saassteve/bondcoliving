import React from 'react';
import { DollarSign, Users, Calendar } from 'lucide-react';
import { type CoworkingPass } from '../../lib/supabase';

interface RevenueData {
  total: number;
  count: number;
}

interface Props {
  revenue: RevenueData;
  passes: CoworkingPass[];
}

const CoworkingStats: React.FC<Props> = ({ revenue, passes }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Total Revenue</p>
            <p className="text-3xl font-bold text-white">{revenue.total.toFixed(2)}</p>
          </div>
          <DollarSign className="w-12 h-12 text-green-500" />
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Total Bookings</p>
            <p className="text-3xl font-bold text-white">{revenue.count}</p>
          </div>
          <Users className="w-12 h-12 text-blue-500" />
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Active Passes</p>
            <p className="text-3xl font-bold text-white">{passes.filter(p => p.is_active).length}</p>
          </div>
          <Calendar className="w-12 h-12 text-purple-500" />
        </div>
      </div>
    </div>
  );
};

export default CoworkingStats;
