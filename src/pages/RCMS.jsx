import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, // Changed from Layout
  Users, 
  UserCog, 
  Settings, 
  Activity, 
  Cpu, 
  Database, 
  Lock, 
  BarChart3, // Changed from BarChart
  Shield, 
  Bell, 
  Clock, 
  TrendingUp,
  CheckCircle
} from 'lucide-react';

const RCMS = () => {
  const modules = [
    {
      title: 'Admin Dashboard',
      icon: LayoutDashboard, // Changed from Layout
      features: ['User Management', 'System Configuration', 'Access Control', 'Audit Logs'],
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Doctor Dashboard',
      icon: UserCog,
      features: ['Patient Search', 'Clinical View', 'AI Predictions', 'Treatment Planning'],
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Nurse Dashboard',
      icon: Users,
      features: ['Patient Management', 'Vital Signs Entry', 'Session Recording', 'Alerts'],
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Patient Management',
      icon: Activity,
      features: ['Patient Records', 'Dialysis History', 'Lab Results', 'Medication Tracking'],
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  const predictions = [
    {
      parameter: 'Dry Weight Adjustment',
      model: 'Balanced Bagging with LightGBM',
      auc: '0.64',
      accuracy: '71%',
      recall: '0.64',
      predictors: ['Arterial Pressure', 'Venous Pressure', 'Ultrafiltration Rate'],
    },
    {
      parameter: 'Hemoglobin Risk',
      model: 'XGBoost-LightGBM Ensemble',
      auc: '0.73',
      accuracy: '68%',
      precision: '0.67',
      predictors: ['Baseline Hemoglobin', 'Albumin', 'Iron Studies'],
    },
    {
      parameter: 'URR Adequacy',
      model: 'LightGBM',
      auc: '0.69',
      accuracy: '63%',
      recall: '0.68',
      predictors: ['Baseline URR', 'Serum Sodium', 'Urea Differences'],
    },
  ];

  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      <div className="py-12 container-custom">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="mb-4 text-4xl font-bold md:text-5xl text-primary-900">
            Renal Care Management System (RCMS)
          </h1>
          <p className="max-w-3xl mx-auto text-xl text-gray-600">
            Ensemble Machine Learning Based Clinical Decision Support System
          </p>
        </motion.div>

        {/* System Architecture */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-8 mb-8 bg-white shadow-lg rounded-xl"
        >
          <h2 className="flex items-center mb-6 text-2xl font-bold text-primary-900">
            <Cpu className="w-6 h-6 mr-2 text-secondary-500" />
            System Architecture
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { layer: 'Data Input Layer', icon: Database, desc: 'Patient records, lab results, HD sessions' },
              { layer: 'ML Engine', icon: TrendingUp, desc: 'Ensemble models for prediction' },
              { layer: 'Dashboard Interface', icon: LayoutDashboard, desc: 'Role-based views' }, // Changed from Layout
              { layer: 'Secure Database', icon: Lock, desc: 'Encrypted storage' },
            ].map((item, idx) => (
              <div key={idx} className="p-4 text-center rounded-lg bg-gray-50">
                <item.icon className="w-8 h-8 mx-auto mb-2 text-secondary-500" />
                <h3 className="text-sm font-semibold">{item.layer}</h3>
                <p className="mt-1 text-xs text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* System Modules */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="mb-6 text-2xl font-bold text-primary-900">System Modules</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {modules.map((module, index) => (
              <div key={index} className="p-6 bg-white shadow-lg rounded-xl">
                <div className={`inline-flex p-3 rounded-lg ${module.color} mb-4`}>
                  <module.icon className="w-6 h-6" />
                </div>
                <h3 className="mb-3 text-lg font-semibold text-primary-900">{module.title}</h3>
                <ul className="space-y-2">
                  {module.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm text-gray-600">
                      <Shield className="w-3 h-3 mr-2 text-secondary-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>

        {/* AI Prediction Models */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-8 mb-8 bg-white shadow-lg rounded-xl"
        >
          <h2 className="flex items-center mb-6 text-2xl font-bold text-primary-900">
            <Activity className="w-6 h-6 mr-2 text-secondary-500" />
            AI Prediction Models Performance
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {predictions.map((pred, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <h3 className="mb-2 font-semibold text-primary-900">{pred.parameter}</h3>
                <p className="mb-3 text-sm text-gray-600">Model: {pred.model}</p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-secondary-600">{pred.auc}</div>
                    <div className="text-xs text-gray-500">ROC-AUC</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-secondary-600">{pred.accuracy}</div>
                    <div className="text-xs text-gray-500">Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-secondary-600">
                      {pred.recall || pred.precision}
                    </div>
                    <div className="text-xs text-gray-500">{pred.recall ? 'Recall' : 'Precision'}</div>
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold text-gray-700">Key Predictors:</p>
                  <div className="flex flex-wrap gap-1">
                    {pred.predictors.map((p, idx) => (
                      <span key={idx} className="px-2 py-1 text-xs bg-gray-100 rounded">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid gap-6 md:grid-cols-2"
        >
          <div className="p-6 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl">
            <h3 className="flex items-center mb-4 text-lg font-semibold text-primary-900">
              <Bell className="w-5 h-5 mr-2 text-secondary-500" />
              Key Features
            </h3>
            <ul className="space-y-2">
              {[
                'Role-based login (Admin, Doctor, Nurse)',
                'Real-time predictive analytics',
                'Interpretable AI outputs',
                'Secure data handling',
                'Patient history tracking',
                'Clinical decision support',
              ].map((item, idx) => (
                <li key={idx} className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl">
            <h3 className="flex items-center mb-4 text-lg font-semibold text-primary-900">
              <Clock className="w-5 h-5 mr-2 text-secondary-500" />
              Implementation Status
            </h3>
            <ul className="space-y-2">
              {[
                '✓ System development completed',
                '✓ Internal validation with 3,856 sessions',
                '✓ Hosted on Faculty of Management servers',
                '→ Pilot testing phase initiated',
                '→ Clinical trial at Teaching Hospital Peradeniya',
                '→ End-user training workshops planned',
              ].map((item, idx) => (
                <li key={idx} className="flex items-center text-sm">
                  <span className="mr-2">{item.includes('✓') ? '✅' : '⏳'}</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RCMS;