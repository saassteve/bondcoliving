import React from 'react';
import { DollarSign, Settings } from 'lucide-react';
import { type CoworkingPass } from '../../lib/supabase';

interface Props {
  passes: CoworkingPass[];
  onEditPass: (pass: CoworkingPass) => void;
  onManagePass: (passId: string) => void;
}

const CoworkingPassList: React.FC<Props> = ({ passes, onEditPass, onManagePass }) => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-600">
        <h2 className="text-lg font-semibold text-[#C5C5B5]">Manage Passes</h2>
        <p className="text-sm text-gray-400 mt-1">Configure capacity and availability for each pass type</p>
      </div>
      <div className="divide-y divide-gray-600">
        {passes.map((pass) => {
          const capacityPercentage = pass.max_capacity
            ? Math.round((pass.current_capacity / pass.max_capacity) * 100)
            : 0;

          return (
            <div key={pass.id} className="p-6 hover:bg-gray-700/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-[#C5C5B5]">{pass.name}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        pass.is_active
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-600 text-gray-400'
                      }`}
                    >
                      {pass.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{pass.description}</p>

                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-gray-400">Price:</span>
                      <span className="ml-2 font-bold text-[#C5C5B5]">{pass.price}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Duration:</span>
                      <span className="ml-2 font-bold text-[#C5C5B5]">{pass.duration_days} days</span>
                    </div>
                  </div>

                  {pass.is_capacity_limited && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-400">
                          Capacity: {pass.current_capacity} / {pass.max_capacity || 0}
                        </span>
                        <span className="text-sm font-bold text-[#C5C5B5]">{capacityPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            capacityPercentage >= 90
                              ? 'bg-red-500'
                              : capacityPercentage >= 70
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {pass.is_date_restricted && (
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      {pass.available_from && (
                        <span className="text-gray-400">
                          From: <span className="text-[#C5C5B5]">{new Date(pass.available_from).toLocaleDateString()}</span>
                        </span>
                      )}
                      {pass.available_until && (
                        <span className="text-gray-400">
                          Until: <span className="text-[#C5C5B5]">{new Date(pass.available_until).toLocaleDateString()}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => onEditPass(pass)} className="btn-secondary">
                    <DollarSign className="w-4 h-4 inline mr-2" />
                    Edit Price
                  </button>
                  <button onClick={() => onManagePass(pass.id)} className="btn-primary">
                    <Settings className="w-4 h-4 inline mr-2" />
                    Manage
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CoworkingPassList;
