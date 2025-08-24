import React from 'react';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface AvailabilityDisplayProps {
  apartmentAvailability: Record<string, any>;
  arrivalDate: string;
  departureDate: string;
}

const AvailabilityDisplay: React.FC<AvailabilityDisplayProps> = ({
  apartmentAvailability,
  arrivalDate,
  departureDate
}) => {
  // Calculate total days from the first apartment's data (they should all be the same)
  const firstApartmentData = Object.values(apartmentAvailability)[0] as any;
  const totalDays = firstApartmentData?.totalDays || 0;

  return (
    <div className="space-y-3">
      {Object.values(apartmentAvailability).map((data: any) => {
        const { apartment, isFullyAvailable, availableDays, totalDays: apartmentTotalDays, unavailablePeriods, suggestions } = data;
        
        return (
          <div key={apartment.id} className={`p-4 rounded-xl border transition-all ${
            isFullyAvailable 
              ? 'bg-green-500/10 border-green-500/30' 
              : availableDays >= 14
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : 'bg-red-500/10 border-red-500/30'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-bold text-[#C5C5B5]">{apartment.title}</h4>
                  <span className="text-sm text-[#C5C5B5]/60">€{apartment.price}/month</span>
                  <span className="text-xs text-[#C5C5B5]/50">{apartment.size} • {apartment.capacity}</span>
                </div>
                
                {isFullyAvailable ? (
                  <div className="flex items-center text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Fully available for your entire stay ({apartmentTotalDays || totalDays} days)
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center text-yellow-400 text-sm">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Available for {availableDays} of {apartmentTotalDays || totalDays} days
                    </div>
                    
                    {unavailablePeriods.length > 0 && (
                      <div className="text-xs text-[#C5C5B5]/60">
                        <strong>Unavailable periods:</strong>
                        {unavailablePeriods.map((period: any, idx: number) => (
                          <div key={idx} className="ml-2">
                            • {new Date(period.start).toLocaleDateString()} - {new Date(period.end).toLocaleDateString()} 
                            ({period.status}: {period.reason})
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {suggestions && (
                      <div className="text-xs text-blue-400 bg-blue-500/10 p-2 rounded">
                        💡 {suggestions}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Mix & Match Suggestions */}
      {(() => {
        const partiallyAvailable = Object.values(apartmentAvailability).filter((data: any) => 
          !data.isFullyAvailable && data.availableDays >= 7
        );
        
        if (partiallyAvailable.length >= 2) {
          return (
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-blue-400 mb-2">Mix & Match Opportunity</h4>
                  <p className="text-sm text-[#C5C5B5]/80 mb-3">
                    You could combine apartments for your full stay:
                  </p>
                  <div className="space-y-1 text-xs text-[#C5C5B5]/70">
                    {partiallyAvailable.slice(0, 3).map((data: any, idx: number) => (
                      <div key={idx}>
                        • <strong>{data.apartment.title}</strong>: {data.availableDays} days available
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-blue-400 mt-2">
                    Select "I'm flexible" below and we'll create a custom arrangement for you.
                  </p>
                </div>
              </div>
            </div>
          );
        }
        return null;
      })()}
    </div>
  );
};

export default AvailabilityDisplay;