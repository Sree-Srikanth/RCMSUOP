import React from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, Target, CheckCircle, Calendar, Users, 
  Database, Activity, Award, Heart, Shield, Globe 
} from 'lucide-react';

const ProjectOverview = () => {
  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      <div className="py-12 container-custom">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="mb-4 text-4xl font-bold md:text-5xl text-primary-900">
            Project Overview
          </h1>
          <p className="text-xl text-gray-600">
            Grant No: URC 515 · Multi-Disciplinary Research Grant · 2024-2026
          </p>
        </motion.div>

        {/* Background */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-8 mb-8 bg-white shadow-lg rounded-xl"
        >
          <h2 className="flex items-center mb-4 text-2xl font-bold text-primary-900">
            <BookOpen className="w-6 h-6 mr-2 text-secondary-500" />
            Background
          </h2>
          <p className="leading-relaxed text-gray-700">
            Sri Lanka's public healthcare system has achieved remarkable progress in maternal health, 
            life expectancy, and infectious disease control. However, hospitals continue to face 
            significant challenges in resource allocation, including uneven distribution of medical 
            supplies, staff shortages, manual administrative systems, and limited predictive planning 
            mechanisms. Artificial Intelligence has demonstrated strong potential in healthcare globally, 
            particularly in predictive analytics, clinical decision support, and operational optimization. 
            This project addresses that gap by developing a context-specific AI-driven resource management 
            system that aligns with the realities of public hospitals in developing economies.
          </p>
        </motion.div>

        {/* Objectives */}
        <div className="grid gap-8 mb-8 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="p-8 bg-white shadow-lg rounded-xl"
          >
            <h2 className="flex items-center mb-4 text-2xl font-bold text-primary-900">
              <Target className="w-6 h-6 mr-2 text-secondary-500" />
              General Objective
            </h2>
            <p className="text-gray-700">
              To design, develop, validate, and pilot-test an Artificial Intelligence-driven expert 
              system that improves hospital resource allocation and supports clinical decision-making 
              in Sri Lankan healthcare settings.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="p-8 bg-white shadow-lg rounded-xl"
          >
            <h2 className="flex items-center mb-4 text-2xl font-bold text-primary-900">
              <CheckCircle className="w-6 h-6 mr-2 text-secondary-500" />
              Specific Objectives
            </h2>
            <ul className="space-y-2">
              {[
                "Identify key clinical, operational, and demographic data requirements for AI-driven hospital resource management",
                "Develop ensemble machine learning models for prediction and classification in hospital settings",
                "Design and implement an AI-powered dashboard for healthcare professionals",
                "Validate the system using real-world retrospective and prospective clinical data",
                "Evaluate the system's effectiveness compared to conventional hospital management practices",
                "Develop a scalable framework for integrating AI into public hospital administration"
              ].map((item, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-secondary-500 rounded-full mt-2 mr-2"></span>
                  <span className="text-sm text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Methodology & Dataset */}
        <div className="grid gap-6 mb-8 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 bg-white shadow-lg rounded-xl"
          >
            <Database className="w-8 h-8 mb-3 text-secondary-500" />
            <h3 className="mb-3 text-lg font-semibold text-primary-900">Dataset</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 45 ESRD patients</li>
              <li>• 3,856 hemodialysis sessions</li>
              <li>• 540 laboratory investigations</li>
              <li>• Teaching Hospital Peradeniya (2024)</li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 bg-white shadow-lg rounded-xl"
          >
            <Activity className="w-8 h-8 mb-3 text-secondary-500" />
            <h3 className="mb-3 text-lg font-semibold text-primary-900">AI Models</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Balanced Bagging</li>
              <li>• XGBoost</li>
              <li>• LightGBM</li>
              <li>• Ensemble Learning</li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-6 bg-white shadow-lg rounded-xl"
          >
            <Award className="w-8 h-8 mb-3 text-secondary-500" />
            <h3 className="mb-3 text-lg font-semibold text-primary-900">Performance</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Hb: ROC-AUC 0.73</li>
              <li>• URR: ROC-AUC 0.69</li>
              <li>• DW: ROC-AUC 0.64</li>
              <li>• Accuracy: 68-71%</li>
            </ul>
          </motion.div>
        </div>

        {/* Ethics & Governance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="p-8 mb-8 text-white bg-gradient-to-r from-primary-900 to-primary-800 rounded-xl"
        >
          <h2 className="flex items-center mb-6 text-2xl font-bold">
            <Shield className="w-6 h-6 mr-2 text-secondary-500" />
            Ethics & Data Governance
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="flex items-center mb-3">
                <CheckCircle className="w-5 h-5 mr-2 text-secondary-500" />
                Ethical approval: 2024/EC/49 (Faculty of Medicine)
              </p>
              <p className="flex items-center mb-3">
                <CheckCircle className="w-5 h-5 mr-2 text-secondary-500" />
                Informed written consent secured from patients
              </p>
              <p className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-secondary-500" />
                Data anonymization protocols strictly followed
              </p>
            </div>
            <div>
              <p className="flex items-center mb-3">
                <CheckCircle className="w-5 h-5 mr-2 text-secondary-500" />
                PROSPERO registered (CRD42024596375)
              </p>
              <p className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-secondary-500" />
                Secure server-based hosting for clinical data
              </p>
            </div>
          </div>
        </motion.div>

        {/* Future Directions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="p-8 bg-white shadow-lg rounded-xl"
        >
          <h2 className="flex items-center mb-4 text-2xl font-bold text-primary-900">
            <Globe className="w-6 h-6 mr-2 text-secondary-500" />
            Future Directions
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              "Expansion to additional hospital units",
              "Integration into national healthcare systems",
              "Development of explainable AI modules",
              "Cross-hospital comparative studies",
              "International collaboration",
              "Real-time clinical workflow integration"
            ].map((item, idx) => (
              <div key={idx} className="flex items-center">
                <Heart className="w-4 h-4 mr-2 text-secondary-500" />
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProjectOverview;