import React from 'react';
import { CheckCircle } from 'lucide-react';

const ProgressTracker = ({ currentStep, steps }) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                currentStep > index + 1
                  ? 'bg-primary-600 border-primary-600'
                  : currentStep === index + 1
                  ? 'border-primary-600 bg-white'
                  : 'border-gray-300 bg-white'
              }`}>
                {currentStep > index + 1 ? (
                  <CheckCircle size={24} className="text-white" />
                ) : (
                  <span className={`font-semibold ${
                    currentStep === index + 1 ? 'text-primary-600' : 'text-gray-400'
                  }`}>
                    {index + 1}
                  </span>
                )}
              </div>
              <span className={`mt-2 text-sm font-medium ${
                currentStep >= index + 1 ? 'text-primary-600' : 'text-gray-500'
              }`}>
                {step.name}
              </span>
            </div>

            {/* Connecting Line */}
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-4 mt-6 ${
                currentStep > index + 1 ? 'bg-primary-600' : 'bg-gray-300'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ProgressTracker;