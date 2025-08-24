import React from 'react';
import { Shuffle, Calendar, Home, MessageSquare } from 'lucide-react';

interface FlexibleOptionsProps {
  formData: {
    flexible_dates: boolean;
    apartment_switching: boolean;
    special_requests: string;
  };
  onInputChange: (field: string, value: string) => void;
}

const FlexibleOptions: React.FC<FlexibleOptionsProps> = ({
  formData,
  onInputChange
}) => {
  return (
    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
      <div className="flex items-start gap-3 mb-4">
        <Shuffle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-bold text-blue-400 mb-2">Flexible Stay Options</h4>
          <p className="text-sm text-[#C5C5B5]/80 mb-4">
            We can help you create a custom stay by combining apartments or adjusting dates. 
            Many guests enjoy experiencing different spaces during their time with us.
          </p>
        </div>
      </div>
      
      <div className="space-y-4">
        <label className="flex items-start text-sm text-[#C5C5B5]/80 cursor-pointer group">
          <input
            type="checkbox"
            checked={formData.flexible_dates}
            onChange={(e) => onInputChange('flexible_dates', e.target.checked.toString())}
            className="mr-3 mt-1 rounded text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span className="font-medium group-hover:text-[#C5C5B5] transition-colors">
                I'm flexible with my dates (±1-2 weeks)
              </span>
            </div>
            <p className="text-xs text-[#C5C5B5]/60 ml-6">
              This gives us more options to find you the perfect combination of apartments
            </p>
          </div>
        </label>
        
        <label className="flex items-start text-sm text-[#C5C5B5]/80 cursor-pointer group">
          <input
            type="checkbox"
            checked={formData.apartment_switching}
            onChange={(e) => onInputChange('apartment_switching', e.target.checked.toString())}
            className="mr-3 mt-1 rounded text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Home className="w-4 h-4 text-blue-400" />
              <span className="font-medium group-hover:text-[#C5C5B5] transition-colors">
                I'm open to switching apartments during my stay
              </span>
            </div>
            <p className="text-xs text-[#C5C5B5]/60 ml-6">
              Experience different spaces and enjoy variety during your time with us
            </p>
          </div>
        </label>

        <div className="relative group">
          <label htmlFor="special_requests" className="block text-sm uppercase tracking-wide mb-3 text-[#C5C5B5]/80">
            <MessageSquare className="w-4 h-4 inline-block mr-2" />
            Special Requests or Notes
          </label>
          <textarea
            id="special_requests"
            value={formData.special_requests}
            onChange={(e) => onInputChange('special_requests', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 bg-[#C5C5B5]/5 border-2 border-[#C5C5B5]/20 rounded-2xl text-[#C5C5B5] placeholder-[#C5C5B5]/40 focus:outline-none focus:border-[#C5C5B5] transition-all resize-none"
            placeholder="Any specific needs, preferences, or questions about your stay..."
          />
          <p className="text-xs text-[#C5C5B5]/60 mt-2">
            Tell us about any specific requirements, accessibility needs, or preferences that would help us create the perfect stay for you.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FlexibleOptions;