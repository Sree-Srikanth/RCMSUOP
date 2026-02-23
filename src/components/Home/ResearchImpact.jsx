import React from 'react';
import { motion } from 'framer-motion';
import { Heart, TrendingUp, BookOpen, Activity, Target, Shield } from 'lucide-react';

const impacts = [
  {
    category: 'Clinical Impact',
    icon: Heart,
    items: [
      'Early identification of high-risk patients',
      'Improved dialysis monitoring',
      'Enhanced decision support for healthcare professionals',
    ],
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  {
    category: 'Management Impact',
    icon: TrendingUp,
    items: [
      'Optimized resource allocation',
      'Reduced operational inefficiencies',
      'Data-driven hospital planning',
    ],
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    category: 'Policy Impact',
    icon: Shield,
    items: [
      'Framework for AI integration in public healthcare',
      'Evidence-based recommendations for policymakers',
      'Scalable model for developing countries',
    ],
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
];

const ResearchImpact = () => {
  return (
    <section className="bg-white section-padding">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold md:text-4xl text-primary-900">
            Research Impact
          </h2>
          <p className="max-w-3xl mx-auto text-xl text-gray-600">
            Transforming healthcare delivery across multiple dimensions
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {impacts.map((impact, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="p-6 transition-all bg-gray-50 rounded-xl hover:shadow-lg"
            >
              <div className={`inline-flex p-3 rounded-lg ${impact.bgColor} mb-4`}>
                <impact.icon className={`w-6 h-6 ${impact.color}`} />
              </div>
              <h3 className="mb-4 text-xl font-semibold text-primary-900">
                {impact.category}
              </h3>
              <ul className="space-y-3">
                {impact.items.map((item, idx) => (
                  <li key={idx} className="flex items-start">
                    <Activity className="w-4 h-4 text-secondary-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ResearchImpact;