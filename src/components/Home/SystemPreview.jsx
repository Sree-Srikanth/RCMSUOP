import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Shield, 
  Users, 
  Settings, 
  Activity, 
  Cpu, 
  BarChart3,  // Changed from BarChart
  LayoutDashboard, // Changed from Layout
  UserCog,
  Bell,
  Clock
} from 'lucide-react';

const SystemPreview = () => {
  return (
    <section className="text-white section-padding bg-gradient-to-br from-primary-900 to-primary-800">
      <div className="container-custom">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-6 text-3xl font-bold md:text-4xl">
              AI Prediction & Decision Support System
            </h2>
            <p className="mb-8 text-xl text-gray-200">
              Ensemble machine learning based clinical decision support system for 
              optimizing hemodialysis outcomes
            </p>

            <div className="mb-8 space-y-4">
              <div className="flex items-center">
                <Shield className="w-5 h-5 mr-3 text-secondary-500" />
                <span>Admin Dashboard · User Management</span>
              </div>
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-3 text-secondary-500" />
                <span>Doctor Dashboard · Patient Search & View</span>
              </div>
              <div className="flex items-center">
                <Settings className="w-5 h-5 mr-3 text-secondary-500" />
                <span>Nurse Dashboard · Patient Management</span>
              </div>
            </div>

            <Link to="/rcms" className="inline-flex items-center px-6 py-3 font-semibold transition-colors rounded-lg bg-secondary-500 text-primary-900 hover:bg-secondary-600">
              Explore RCMS System
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="p-6 bg-white/10 backdrop-blur-sm rounded-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-sm text-gray-300">AI Prediction Demo</span>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-white/5">
                <div className="flex justify-between mb-2">
                  <span>Dry Weight Prediction</span>
                  <span className="font-bold text-secondary-500">ROC-AUC 0.64</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="w-2/3 h-full rounded-full bg-secondary-500"></div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-white/5">
                <div className="flex justify-between mb-2">
                  <span>Hemoglobin Risk</span>
                  <span className="font-bold text-secondary-500">ROC-AUC 0.73</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="w-3/4 h-full rounded-full bg-secondary-500"></div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-white/5">
                <div className="flex justify-between mb-2">
                  <span>URR Adequacy</span>
                  <span className="font-bold text-secondary-500">ROC-AUC 0.69</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="w-4/5 h-full rounded-full bg-secondary-500"></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <Activity className="w-6 h-6 mx-auto mb-1 text-secondary-500" />
                <span className="text-xs">DW Adjustment</span>
              </div>
              <div className="text-center">
                <Cpu className="w-6 h-6 mx-auto mb-1 text-secondary-500" />
                <span className="text-xs">Ensemble ML</span>
              </div>
              <div className="text-center">
                <BarChart3 className="w-6 h-6 mx-auto mb-1 text-secondary-500" /> {/* Changed from BarChart */}
                <span className="text-xs">Real-time</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SystemPreview;