import React from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Building2,  // Replaced Hospital with Building2
  Database, 
  Cpu, 
  BarChart3,   // Replaced BarChart with BarChart3
  Globe 
} from 'lucide-react';

const highlights = [
  {
    icon: Brain,
    title: 'AI-Powered Clinical Decision Support',
    description: 'Ensemble machine learning models for predictive analytics in dialysis management',
    color: 'bg-primary-50 text-primary-700',
  },
  {
    icon: Building2,  // Changed from Hospital
    title: 'Developed at Teaching Hospital Peradeniya',
    description: 'Real-world clinical data from Renal Care Unit',
    color: 'bg-primary-50 text-primary-700',
  },
  {
    icon: Database,
    title: 'Validated with Real Clinical Data',
    description: '3,543 dialysis records and 540 laboratory investigations',
    color: 'bg-primary-50 text-primary-700',
  },
  {
    icon: Cpu,
    title: 'Ensemble Machine Learning Models',
    description: 'Balanced Bagging, XGBoost, LightGBM for optimal performance',
    color: 'bg-primary-50 text-primary-700',
  },
  {
    icon: BarChart3,  // Changed from BarChart
    title: 'High-Performance Predictive System',
    description: 'ROC-AUC scores: 0.73 (Hb), 0.69 (URR), 0.64 (DW)',
    color: 'bg-primary-50 text-primary-700',
  },
  {
    icon: Globe,
    title: 'Framework for National Deployment',
    description: 'Scalable AI integration for public healthcare systems',
    color: 'bg-primary-50 text-primary-700',
  },
];

const KeyHighlights = () => {
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
            Key Project Highlights
          </h2>
          <p className="max-w-3xl mx-auto text-xl text-gray-600">
            Transforming healthcare through innovative AI solutions
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {highlights.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="p-6 transition-all border-l-4 bg-gray-50 rounded-xl hover:shadow-lg border-secondary-500"
            >
              <div className={`inline-flex p-3 rounded-lg ${item.color} mb-4`}>
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-primary-900">
                {item.title}
              </h3>
              <p className="text-sm text-gray-600">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default KeyHighlights;