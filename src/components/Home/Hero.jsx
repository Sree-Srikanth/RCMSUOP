import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, Calendar, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <div className="relative flex items-center min-h-screen overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }} />
      </div>

      <div className="relative z-10 pt-20 container-custom">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="inline-flex items-center px-4 py-2 mb-6 rounded-full bg-white/10 backdrop-blur-sm">
            <span className="w-2 h-2 mr-2 rounded-full bg-secondary-500 animate-pulse"></span>
            <span className="text-sm font-medium text-white">Multi-Disciplinary Research Grant · 2024-2026</span>
          </div>

          <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
            Effective AI-Based Resource Distribution Management System
            <span className="block mt-2 text-secondary-500">for Hospitals in Sri Lanka</span>
          </h1>

          <p className="max-w-3xl mx-auto mb-8 text-xl leading-relaxed text-gray-200">
            Developing an Artificial Intelligence–driven decision support system to optimize hospital 
            resource allocation and clinical decision-making in Sri Lankan public healthcare settings.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Link to="/rcms" className="flex items-center btn-secondary">
              Explore RCMS System
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link to="/project-overview" className="px-6 py-3 font-semibold text-white transition-all rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20">
              Learn More
            </Link>
          </div>

          <div className="grid max-w-3xl grid-cols-2 gap-4 mx-auto md:grid-cols-4">
            <div className="p-4 rounded-lg bg-white/10 backdrop-blur-sm">
              <Calendar className="w-6 h-6 mx-auto mb-2 text-secondary-500" />
              <div className="font-bold text-white">2024-2026</div>
              <div className="text-xs text-gray-300">Project Duration</div>
            </div>
            <div className="p-4 rounded-lg bg-white/10 backdrop-blur-sm">
              <Users className="w-6 h-6 mx-auto mb-2 text-secondary-500" />
              <div className="font-bold text-white">8</div>
              <div className="text-xs text-gray-300">Investigators</div>
            </div>
            <div className="p-4 rounded-lg bg-white/10 backdrop-blur-sm">
              <Award className="w-6 h-6 mx-auto mb-2 text-secondary-500" />
              <div className="font-bold text-white">3,856</div>
              <div className="text-xs text-gray-300">HD Sessions</div>
            </div>
            <div className="p-4 rounded-lg bg-white/10 backdrop-blur-sm">
              <span className="block text-2xl font-bold text-secondary-500">45</span>
              <div className="text-xs text-gray-300">Patients</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;