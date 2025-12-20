import React from 'react';
import { type CoworkingPass } from '../../lib/supabase';

interface Props {
  pass: CoworkingPass;
  onUpdate: (updates: Partial<CoworkingPass>) => void;
  onSave: () => void;
  onCancel: () => void;
}

const CoworkingPassEditModal: React.FC<Props> = ({ pass, onUpdate, onSave, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-xl font-bold text-[#C5C5B5] mb-4">Edit Pass Price</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Pass Name</label>
              <input
                type="text"
                className="input bg-gray-700 text-gray-300"
                value={pass.name}
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Price</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input"
                value={pass.price}
                onChange={(e) => onUpdate({ price: parseFloat(e.target.value) || 0 })}
              />
              <p className="text-xs text-gray-400 mt-1">
                This price will be used for all new bookings and Stripe checkout
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="pass-active"
                className="mr-2"
                checked={pass.is_active}
                onChange={(e) => onUpdate({ is_active: e.target.checked })}
              />
              <label htmlFor="pass-active" className="text-sm text-gray-300">
                Pass is active and visible to customers
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="btn bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600"
            >
              Cancel
            </button>
            <button onClick={onSave} className="btn-primary">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoworkingPassEditModal;
