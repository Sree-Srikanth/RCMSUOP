import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, BookOpen, Award, Calendar, CheckCircle, ChevronRight, ExternalLink } from 'lucide-react';

const ResearchPublications = () => {
  const [activeCategory, setActiveCategory] = useState('abstracts');

  const categories = [
    { id: 'abstracts', label: 'Published Abstracts', icon: FileText, count: 3 },
    { id: 'manuscripts', label: 'Manuscripts in Progress', icon: BookOpen, count: 2 },
    { id: 'submissions', label: 'Recent Submissions', icon: ChevronRight, count: 2 },
  ];

  const abstracts = [
    {
      title: "Applications of Artificial Intelligence in Haemodialysis Therapy for End-Stage Renal Disease: A Systematic Review",
      venue: "Young Scientists Conference on Multidisciplinary Research (YSCMR-2025)",
      status: "Published",
      date: "2025",
      link: "#yscmr-2025-abstract"
    },
    {
      title: "Ensemble Learning–Based Decision Support System for Optimizing Hemodialysis Outcomes in Patients with End Stage Renal Disease",
      venue: "National Health Research Symposium 2025",
      status: "Published",
      date: "2025",
      award: "Best Oral Presentation Award",
      link: "#nhrs-2025-abstract"
    },
    {
      title: "Enhancing government resource management through smart technologies - A survey on healthcare professionals in Sri Lanka",
      venue: "iPURSE 2024",
      status: "Published",
      date: "2024",
      link: "#ipurse-2024-abstract"
    },
  ];

  const manuscripts = [
    {
      title: "Harnessing Artificial Intelligence for Optimizing Hemodialysis Care in End Stage Renal Disease: A Systematic Review",
      status: "Study completed; manuscript finalization in progress",
      type: "Full Paper",
      link: "#ai-hemodialysis-manuscript"
    },
    {
      title: "Clinical and Investigative Profiles of Hemodialysis Patients from a Tertiary Care Center in Sri Lanka: A Retrospective Analysis of Hospital Records",
      status: "Initial analysis completed; manuscript preparation in progress",
      type: "Full Paper",
      link: "#clinical-profiles-manuscript"
    },
  ];

  const submissions = [
    {
      title: "Ensemble Machine Learning Based Clinical Decision Support System for Optimizing Hemodialysis Parameters in End-Stage Renal Disease Patients",
      venue: "9th IEEE International Research Conference on Smart Computing and Systems Engineering (SCSE)",
      status: "Submitted",
      link: "#scse-2025-submission"
    },
    {
      title: "AI-Driven Clinical Decision Support for Hemodialysis: A Systematic Review and Meta-Analysis",
      venue: "Q1 Journal",
      status: "Under Peer Review",
      link: "#q1-journal-submission"
    },
  ];

  const getActivePublications = () => {
    switch(activeCategory) {
      case 'abstracts':
        return abstracts;
      case 'manuscripts':
        return manuscripts;
      case 'submissions':
        return submissions;
      default:
        return abstracts;
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      <div className="py-12 container-custom">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="mb-4 text-4xl font-bold md:text-5xl text-primary-900">
            Research & Publications
          </h1>
          <p className="text-xl text-gray-600">
            Academic outputs from Grant No: URC 515
          </p>
        </motion.div>

        {/* Awards Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-8 mb-8 border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl"
        >
          <div className="flex items-center mb-4">
            <Award className="w-8 h-8 mr-3 text-yellow-600" />
            <h2 className="text-2xl font-bold text-primary-900">Awards & Recognition</h2>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="mb-2 text-xl font-semibold text-primary-800">
              Best Oral Presentation Award
            </h3>
            <p className="text-gray-700">
              "Ensemble Learning–Based Decision Support System for Optimizing Hemodialysis Outcomes 
              in Patients with End Stage Renal Disease"
            </p>
            <p className="mt-2 text-sm text-gray-500">
              National Health Research Symposium 2025
            </p>
          </div>
        </motion.div>

        {/* Category Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                    activeCategory === category.id
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {category.label}
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    activeCategory === category.id
                      ? 'bg-white text-primary-600'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {category.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Content Based on Active Category */}
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-8 mb-8 bg-white shadow-lg rounded-xl"
        >
          <h2 className="flex items-center mb-6 text-2xl font-bold text-primary-900">
            {activeCategory === 'abstracts' && <FileText className="w-6 h-6 mr-2 text-secondary-500" />}
            {activeCategory === 'manuscripts' && <BookOpen className="w-6 h-6 mr-2 text-secondary-500" />}
            {activeCategory === 'submissions' && <ChevronRight className="w-6 h-6 mr-2 text-secondary-500" />}
            {categories.find(c => c.id === activeCategory)?.label}
          </h2>
          
          <div className="space-y-4">
            {getActivePublications().map((item, index) => (
              <div key={index} className="py-2 pl-4 border-l-4 border-secondary-500 group hover:bg-gray-50 transition-colors rounded-r-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-primary-900">{item.title}</h3>
                      <a 
                        href={item.link}
                        onClick={(e) => {
                          e.preventDefault();
                          // This will just scroll to top with #, you can replace with actual links later
                          window.location.hash = item.link.substring(1);
                        }}
                        className="ml-4 p-2 text-gray-400 hover:text-primary-600 transition-colors"
                        title="View article"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    {item.venue && (
                      <p className="mt-1 text-sm text-gray-600">{item.venue}</p>
                    )}
                    <div className="flex items-center mt-2 flex-wrap gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.status === 'Published' ? 'text-green-700 bg-green-100' :
                        item.status === 'Submitted' ? 'bg-blue-100 text-blue-700' :
                        item.status === 'Under Peer Review' ? 'bg-purple-100 text-purple-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {item.status}
                      </span>
                      {item.date && (
                        <span className="flex items-center text-xs text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          {item.date}
                        </span>
                      )}
                      {item.type && (
                        <span className="px-2 py-1 text-xs text-gray-700 bg-gray-100 rounded-full">
                          {item.type}
                        </span>
                      )}
                    </div>
                  </div>
                  {item.award && (
                    <span className="px-3 py-1 ml-4 text-xs text-yellow-700 bg-yellow-100 rounded-full whitespace-nowrap">
                      🏆 {item.award}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Publication Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6 bg-primary-50 rounded-xl"
        >
          <h3 className="mb-3 text-lg font-semibold text-primary-900">Publication Summary</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <div className="text-2xl font-bold text-primary-700">3</div>
              <div className="text-sm text-gray-600">Published Abstracts</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-700">2</div>
              <div className="text-sm text-gray-600">Manuscripts in Progress</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-700">2</div>
              <div className="text-sm text-gray-600">Recent Submissions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-700">1</div>
              <div className="text-sm text-gray-600">Awards</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResearchPublications;