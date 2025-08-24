import React from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';

interface FormNavigationProps {
  currentStep: number;
  totalSteps: number;
  isSubmitting: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

const FormNavigation: React.FC<FormNavigationProps> = ({
  currentStep,
  totalSteps,
  isSubmitting,
  onPrevious,
  onNext,
  onSubmit
}) => {
  return (
    <div className="flex justify-between mt-12">
      {currentStep > 1 && (
        <button
          type="button"
          onClick={onPrevious}
          className="px-8 py-4 bg-[#C5C5B5]/10 text-[#C5C5B5] rounded-full hover:bg-[#C5C5B5]/20 transition-all font-semibold text-sm uppercase tracking-wide border border-[#C5C5B5]/20"
        >
          Previous
        </button>
      )}
      
      <div className="ml-auto">
        {currentStep < totalSteps ? (
          <button
            type="button"
            onClick={onNext}
            className="px-8 py-4 bg-[#C5C5B5] text-[#1E1F1E] rounded-full hover:bg-white transition-all font-semibold text-sm uppercase tracking-wide shadow-lg hover:shadow-xl hover:scale-105 flex items-center"
          >
            Next Step
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        ) : (
          <button
            type="submit"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="px-8 py-4 bg-[#C5C5B5] text-[#1E1F1E] rounded-full hover:bg-white transition-all font-semibold text-sm uppercase tracking-wide shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1E1F1E] mr-3"></div>
                Submitting...
              </>
            ) : (
              <>
                Submit Application
                <CheckCircle className="ml-2 h-5 w-5" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default FormNavigation;