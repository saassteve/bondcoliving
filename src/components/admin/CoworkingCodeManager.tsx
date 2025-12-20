import React, { useState } from 'react';
import { Plus, Trash } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PassCode {
  id: string;
  code: string;
  is_used: boolean;
  used_at: string | null;
  booking_id: string | null;
  created_at: string;
}

interface Props {
  passCodes: PassCode[];
  onRefresh: () => void;
  onViewBooking: (bookingId: string) => void;
}

const CoworkingCodeManager: React.FC<Props> = ({ passCodes, onRefresh, onViewBooking }) => {
  const [newCode, setNewCode] = useState('');

  const handleAddCode = async () => {
    if (!newCode.trim()) {
      alert('Please enter a code');
      return;
    }

    try {
      const { error } = await supabase.from('coworking_pass_codes').insert([{ code: newCode.trim() }]);

      if (error) throw error;

      setNewCode('');
      onRefresh();
      alert('Code added successfully!');
    } catch (error: any) {
      console.error('Error adding code:', error);
      if (error.code === '23505') {
        alert('This code already exists!');
      } else {
        alert('Failed to add code');
      }
    }
  };

  const handleDeleteCode = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this code?')) return;

    try {
      const { error } = await supabase.from('coworking_pass_codes').delete().eq('id', id);

      if (error) throw error;

      onRefresh();
      alert('Code deleted successfully!');
    } catch (error) {
      console.error('Error deleting code:', error);
      alert('Failed to delete code. Only unused codes can be deleted.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-600">
          <h2 className="text-lg font-semibold text-[#C5C5B5] mb-2">Daypass Access Codes</h2>
          <p className="text-sm text-gray-400">
            Add codes that will be automatically sent to guests when they book a coworking pass.
            Codes are assigned on a first-come, first-served basis.
          </p>
        </div>

        <div className="p-6 border-b border-gray-600">
          <div className="flex gap-3">
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCode()}
              placeholder="Enter new access code (e.g., 1234#)"
              className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#C5C5B5]"
            />
            <button onClick={handleAddCode} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Code
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-600">
          <div className="grid grid-cols-12 gap-4 p-4 bg-gray-700 text-xs font-medium text-gray-400 uppercase">
            <div className="col-span-4">Code</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3">Used At</div>
            <div className="col-span-2">Booking</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {passCodes.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No codes added yet. Add your first access code above.
            </div>
          ) : (
            passCodes.map((code) => (
              <div key={code.id} className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-700/50 transition-colors items-center">
                <div className="col-span-4">
                  <code className="text-sm font-mono text-[#C5C5B5] bg-gray-700 px-2 py-1 rounded">
                    {code.code}
                  </code>
                </div>
                <div className="col-span-2">
                  {code.is_used ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900/50 text-red-300 border border-red-700">
                      Used
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-300 border border-green-700">
                      Available
                    </span>
                  )}
                </div>
                <div className="col-span-3 text-sm text-gray-300">
                  {code.used_at ? new Date(code.used_at).toLocaleString() : '-'}
                </div>
                <div className="col-span-2 text-sm text-gray-300">
                  {code.booking_id ? (
                    <button
                      onClick={() => onViewBooking(code.booking_id!)}
                      className="text-indigo-400 hover:text-indigo-300 underline"
                    >
                      View
                    </button>
                  ) : (
                    '-'
                  )}
                </div>
                <div className="col-span-1 text-right">
                  {!code.is_used && (
                    <button onClick={() => handleDeleteCode(code.id)} className="text-red-400 hover:text-red-300">
                      <Trash className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-gray-700/50 border-t border-gray-600">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-300">
              <span className="font-bold text-[#C5C5B5]">{passCodes.filter(c => !c.is_used).length}</span> available /
              <span className="font-bold text-[#C5C5B5] ml-1">{passCodes.length}</span> total codes
            </div>
            {passCodes.filter(c => !c.is_used).length === 0 && passCodes.length > 0 && (
              <div className="text-yellow-400 font-medium">
                No codes available! Add more codes for new bookings.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoworkingCodeManager;
