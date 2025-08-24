import React from 'react';
import { CheckCircle } from 'lucide-react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps = 3
}) => {
  return (
    <div className="mb-12">
      <div className="flex items-center justify-center space-x-4">
        {Array.from({ length: totalSteps }, (_, index) => {
          const step = index + 1;
          return (
            <React.Fragment key={step}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step <= currentStep 
                  ? 'bg-[#C5C5B5] text-[#1E1F1E]' 
                  : 'bg-[#C5C5B5]/20 text-[#C5C5B5]/60'
              }`}>
                {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
              </div>
              {step < totalSteps && (
                <div className={`w-12 h-1 rounded-full transition-all ${
                  step < currentStep ? 'bg-[#C5C5B5]' : 'bg-[#C5C5B5]/20'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className="text-center mt-4">
        <p className="text-[#C5C5B5]/60 text-sm">
          Step {currentStep} of {totalSteps}
        </p>
      </div>
    </div>
  );
};

export default ProgressIndicator;