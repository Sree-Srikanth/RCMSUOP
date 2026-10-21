import React from 'react';
import { motion } from 'framer-motion';
import ResearchBackground from './ResearchBackground';

// Page header with the University of Peradeniya campus behind a maroon
// research-themed overlay.
const PageBanner = ({ title, subtitle, eyebrow = 'University of Peradeniya' }) => {
  return (
    <section className="relative overflow-hidden bg-primary-950">
      <img
        src={`${import.meta.env.BASE_URL}images/uop-campus.jpg`}
        alt=""
        className="absolute inset-0 object-cover w-full h-full"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-primary-950/95 via-primary-900/85 to-primary-900/70" />
      <ResearchBackground opacity={0.3} />

      <div className="relative py-16 text-center md:py-20 container-custom">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="mb-3 text-sm font-semibold tracking-[0.25em] uppercase text-secondary-300">
            {eyebrow}
          </p>
          <h1 className="mb-4 text-4xl font-bold md:text-5xl text-gold-gradient">{title}</h1>
          <div className="flex justify-center mb-4">
            <div className="w-24 h-1 rounded-full bg-gradient-to-r from-secondary-600 via-secondary-300 to-secondary-600" />
          </div>
          {subtitle && <p className="max-w-3xl mx-auto text-xl text-gray-200">{subtitle}</p>}
        </motion.div>
      </div>
    </section>
  );
};

export default PageBanner;
