import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Database, FileText, Activity, BookOpen, Award, Users } from 'lucide-react';

const stats = [
  { icon: Database, value: '3,543', label: 'Dialysis Records Used' },
  { icon: FileText, value: '540', label: 'Laboratory Records' },
  { icon: Activity, value: '3', label: 'AI Prediction Models' },
  { icon: BookOpen, value: '82', label: 'Systematic Review Studies' },
  { icon: FileText, value: '3', label: 'Abstracts Published' },
  { icon: Award, value: '1', label: 'Award-Winning Research' },
];

const QuickStats = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section className="section-padding bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="container-custom">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl text-primary-900">
            Project Statistics
          </h2>
          <p className="text-xl text-gray-600">
            Real impact through data-driven research
          </p>
        </div>

        <div
          ref={ref}
          className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-6 text-center transition-shadow bg-white shadow-lg rounded-xl hover:shadow-xl"
            >
              <stat.icon className="w-8 h-8 mx-auto mb-3 text-secondary-500" />
              <div className="mb-1 text-2xl font-bold text-primary-900">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="p-6 mt-8 text-center text-white bg-primary-900 rounded-xl"
        >
          <p className="text-lg font-semibold">
            Best Oral Presentation Award · National Health Research Symposium 2025
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default QuickStats;