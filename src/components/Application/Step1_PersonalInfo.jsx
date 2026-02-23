import React, { useState } from 'react';
import { Upload, X, Eye } from 'lucide-react';

const Step1_PersonalInfo = ({ formData, updateFormData }) => {
  const [birthCertFile, setBirthCertFile] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        alert('File size must be less than 1MB');
        return;
      }
      setBirthCertFile(file);
      updateFormData('personalInfo', { ...formData.personalInfo, birthCertificate: file });
    }
  };

  const removeFile = () => {
    setBirthCertFile(null);
    updateFormData('personalInfo', { ...formData.personalInfo, birthCertificate: null });
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
        <p className="text-gray-600 mt-2">
          Please provide your personal details accurately. Fields marked with * are required.
        </p>
      </div>

      {/* Alert Box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-800">
              Please attach a copy of your Birth Certificate (PDF/JPG/PNG, max 1MB).
            </p>
          </div>
        </div>
      </div>

      {/* Form Grid */}
      <div className="space-y-6">
        {/* Row 1: Title & Names */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <select
              value={formData.personalInfo.title || ''}
              onChange={(e) => updateFormData('personalInfo', { ...formData.personalInfo, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select Title</option>
              <option value="Rev">Rev.</option>
              <option value="Dr">Dr.</option>
              <option value="Mr">Mr.</option>
              <option value="Mrs">Mrs.</option>
              <option value="Miss">Miss</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name * <span className="text-gray-500 text-xs">(underline Surname)</span>
            </label>
            <input
              type="text"
              value={formData.personalInfo.fullName || ''}
              onChange={(e) => updateFormData('personalInfo', { ...formData.personalInfo, fullName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="John David Smith"
            />
          </div>
        </div>

        {/* Row 2: Name with Initials */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name with Initials *
          </label>
          <input
            type="text"
            value={formData.personalInfo.nameWithInitials || ''}
            onChange={(e) => updateFormData('personalInfo', { ...formData.personalInfo, nameWithInitials: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="J. D. Smith"
          />
        </div>

        {/* Row 3: Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Postal Address *
          </label>
          <textarea
            value={formData.personalInfo.postalAddress || ''}
            onChange={(e) => updateFormData('personalInfo', { ...formData.personalInfo, postalAddress: e.target.value })}
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter your complete postal address"
          />
        </div>

        {/* Row 4: Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mobile Phone *
            </label>
            <input
              type="tel"
              value={formData.personalInfo.mobile || ''}
              onChange={(e) => updateFormData('personalInfo', { ...formData.personalInfo, mobile: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="07XXXXXXXX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Residence Phone
            </label>
            <input
              type="tel"
              value={formData.personalInfo.residencePhone || ''}
              onChange={(e) => updateFormData('personalInfo', { ...formData.personalInfo, residencePhone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Office Phone
            </label>
            <input
              type="tel"
              value={formData.personalInfo.officePhone || ''}
              onChange={(e) => updateFormData('personalInfo', { ...formData.personalInfo, officePhone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Row 5: Email (Readonly) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            value="user@email.com" // Replace with actual user email
            readOnly
            className="w-full px-4 py-2 border border-gray-300 bg-gray-50 rounded-lg cursor-not-allowed"
          />
        </div>

        {/* Row 6: Date of Birth & Age */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth *
            </label>
            <input
              type="date"
              value={formData.personalInfo.dob || ''}
              onChange={(e) => {
                const dob = e.target.value;
                const age = dob ? calculateAge(dob) : null;
                updateFormData('personalInfo', { 
                  ...formData.personalInfo, 
                  dob,
                  age 
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age
            </label>
            <input
              type="text"
              value={formData.personalInfo.age ? `${formData.personalInfo.age} Years` : ''}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 bg-gray-50 rounded-lg"
            />
          </div>
        </div>

        {/* Row 7: Civil Status & Citizenship */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Civil Status *
            </label>
            <select
              value={formData.personalInfo.civilStatus || ''}
              onChange={(e) => updateFormData('personalInfo', { ...formData.personalInfo, civilStatus: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sri Lankan Citizenship *
            </label>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="byDescent"
                  name="citizenship"
                  value="by_descent"
                  checked={formData.personalInfo.citizenshipType === 'by_descent'}
                  onChange={(e) => updateFormData('personalInfo', { 
                    ...formData.personalInfo, 
                    citizenshipType: e.target.value 
                  })}
                  className="h-4 w-4 text-primary-600"
                />
                <label htmlFor="byDescent" className="ml-2 text-sm text-gray-700">
                  By Descent
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="byRegistration"
                  name="citizenship"
                  value="by_registration"
                  checked={formData.personalInfo.citizenshipType === 'by_registration'}
                  onChange={(e) => updateFormData('personalInfo', { 
                    ...formData.personalInfo, 
                    citizenshipType: e.target.value 
                  })}
                  className="h-4 w-4 text-primary-600"
                />
                <label htmlFor="byRegistration" className="ml-2 text-sm text-gray-700">
                  By Registration
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Row 8: If by registration, show reference number */}
        {formData.personalInfo.citizenshipType === 'by_registration' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Citizenship Reference Number *
            </label>
            <input
              type="text"
              value={formData.personalInfo.citizenshipRefNumber || ''}
              onChange={(e) => updateFormData('personalInfo', { ...formData.personalInfo, citizenshipRefNumber: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter reference number"
            />
          </div>
        )}

        {/* Row 9: NIC & Passport */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              NIC Number *
            </label>
            <input
              type="text"
              value={formData.personalInfo.nicNumber || ''}
              onChange={(e) => updateFormData('personalInfo', { ...formData.personalInfo, nicNumber: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="XXXXXXXXXV"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Passport Number (If available)
            </label>
            <input
              type="text"
              value={formData.personalInfo.passportNumber || ''}
              onChange={(e) => updateFormData('personalInfo', { ...formData.personalInfo, passportNumber: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* File Upload Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Birth Certificate *
          </label>
          <div className="mt-2">
            {birthCertFile ? (
              <div className="flex items-center justify-between p-4 border border-gray-300 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-3">
                  <FileText size={20} className="text-primary-600" />
                  <div>
                    <p className="font-medium text-gray-900">{birthCertFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(birthCertFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    className="p-2 text-gray-500 hover:text-gray-700"
                    onClick={() => window.open(URL.createObjectURL(birthCertFile), '_blank')}
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    type="button"
                    className="p-2 text-red-500 hover:text-red-700"
                    onClick={removeFile}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors">
                <input
                  type="file"
                  id="birth-certificate"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                />
                <label
                  htmlFor="birth-certificate"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload size={32} className="text-gray-400 mb-3" />
                  <span className="text-sm font-medium text-primary-600">
                    Click to upload Birth Certificate
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    PDF, JPG or PNG (Max 1MB)
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate age
const calculateAge = (dob) => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export default Step1_PersonalInfo;