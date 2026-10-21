import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, Calendar, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import ResearchBackground from '../Common/ResearchBackground';

const Hero = () => {
  return (
    <div className="relative flex items-center min-h-screen overflow-hidden bg-primary-950">
      {/* University of Peradeniya campus */}
      <motion.img
        src={`${import.meta.env.BASE_URL}images/uop-campus.jpg`}
        alt="University of Peradeniya campus"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 8, ease: 'easeOut' }}
        className="absolute inset-0 object-cover w-full h-full"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary-950/90 via-primary-900/80 to-primary-950/95" />
      <ResearchBackground opacity={0.35} />

      <div className="relative z-10 pt-20 container-custom">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <p className="mb-4 text-sm font-semibold tracking-[0.3em] uppercase text-secondary-300">
            University of Peradeniya · Sri Lanka
          </p>

          <div className="inline-flex items-center px-4 py-2 mb-6 border rounded-full bg-white/10 backdrop-blur-sm border-secondary-400/30">
            <span className="w-2 h-2 mr-2 rounded-full bg-secondary-500 animate-pulse"></span>
            <span className="text-sm font-medium text-white">Multi-Disciplinary Research Grant · 2024-2026</span>
          </div>

          <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
            Effective AI-Based Resource Distribution Management System
            <span className="block mt-2 text-gold-gradient">for Hospitals in Sri Lanka</span>
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
            <Link to="/project-overview" className="px-6 py-3 font-semibold text-white transition-all border rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 border-white/30">
              Learn More
            </Link>
          </div>

          <div className="grid max-w-3xl grid-cols-2 gap-4 mx-auto md:grid-cols-4">
            <div className="p-4 border rounded-lg bg-white/10 backdrop-blur-sm border-secondary-400/20">
              <Calendar className="w-6 h-6 mx-auto mb-2 text-secondary-500" />
              <div className="font-bold text-white">2024-2026</div>
              <div className="text-xs text-gray-300">Project Duration</div>
            </div>
            <div className="p-4 border rounded-lg bg-white/10 backdrop-blur-sm border-secondary-400/20">
              <Users className="w-6 h-6 mx-auto mb-2 text-secondary-500" />
              <div className="font-bold text-white">8</div>
              <div className="text-xs text-gray-300">Investigators</div>
            </div>
            <div className="p-4 border rounded-lg bg-white/10 backdrop-blur-sm border-secondary-400/20">
              <Award className="w-6 h-6 mx-auto mb-2 text-secondary-500" />
              <div className="font-bold text-white">3,856</div>
              <div className="text-xs text-gray-300">HD Sessions</div>
            </div>
            <div className="p-4 border rounded-lg bg-white/10 backdrop-blur-sm border-secondary-400/20">
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