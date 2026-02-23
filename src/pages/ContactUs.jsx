import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  Clock, 
  Shield, 
  CheckCircle, 
  Heart,
  Building2  // Added Building2 for address
} from 'lucide-react';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    alert('Thank you for your message. We will get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
            Contact Us
          </h1>
          <p className="text-xl text-gray-600">
            Get in touch with the research team
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="p-6 mb-6 bg-white shadow-lg rounded-xl">
              <h2 className="flex items-center mb-4 text-xl font-bold text-primary-900">
                <Heart className="w-5 h-5 mr-2 text-secondary-500" />
                Principal Investigator
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-primary-800">Dr. S. Maheswaran</h3>
                  <p className="text-sm text-gray-600">Senior Lecturer (Grade I)</p>
                  <p className="text-sm text-gray-600">Department of Operations Management</p>
                  <p className="text-sm text-gray-600">Faculty of Management</p>
                </div>
                <div className="pt-2 border-t">
                  <a 
                    href="mailto:mahessiva@mgt.pdn.ac.lk" 
                    className="flex items-center text-primary-600 hover:text-primary-700"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    mahessiva@mgt.pdn.ac.lk
                  </a>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white shadow-lg rounded-xl">
              <h2 className="mb-4 text-xl font-bold text-primary-900">Institutional Address</h2>
              <div className="space-y-3">
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-secondary-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-gray-700">Faculty of Management</p>
                    <p className="text-gray-700">University of Peradeniya</p>
                    <p className="text-gray-700">Peradeniya 20400</p>
                    <p className="text-gray-700">Sri Lanka</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 mt-6 bg-primary-50 rounded-xl">
              <h3 className="flex items-center mb-3 font-semibold text-primary-900">
                <Shield className="w-4 h-4 mr-2 text-secondary-500" />
                Grant Information
              </h3>
              <p className="mb-2 text-sm text-gray-700">
                <strong>Grant No:</strong> URC 515
              </p>
              <p className="mb-2 text-sm text-gray-700">
                <strong>Duration:</strong> 2024 – 2026
              </p>
              <p className="text-sm text-gray-700">
                <strong>Ethical Approval:</strong> 2024/EC/49
              </p>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="p-8 bg-white shadow-lg rounded-xl">
              <h2 className="mb-6 text-2xl font-bold text-primary-900">Send a Message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Your Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Research collaboration inquiry"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Your message here..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="flex items-center justify-center w-full px-6 py-3 font-semibold text-white transition-colors rounded-lg bg-primary-600 hover:bg-primary-700"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Send Message
                </button>
              </form>

              <div className="pt-6 mt-6 border-t">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Response within 2-3 business days
                  </span>
                  <span className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                    Secure communication
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Map or Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 mt-8 bg-white shadow-lg rounded-xl"
        >
          <h3 className="mb-4 text-lg font-semibold text-primary-900">Other Contact Points</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <Mail className="w-6 h-6 mx-auto mb-2 text-secondary-500" />
              <p className="text-sm font-medium">Research Inquiries</p>
              <a href="mailto:research@mgt.pdn.ac.lk" className="text-xs text-primary-600">
                coordinatorurc@gs.pdn.ac.lk
              </a>
            </div>
            <div className="text-center">
              <Phone className="w-6 h-6 mx-auto mb-2 text-secondary-500" />
              <p className="text-sm font-medium">Department Office</p>
              <p className="text-xs text-gray-600">+(123) 456-7890</p>
            </div>
            <div className="text-center">
              <Shield className="w-6 h-6 mx-auto mb-2 text-secondary-500" />
              <p className="text-sm font-medium">Ethics Committee</p>
              <a href="mailto:ethics@med.pdn.ac.lk" className="text-xs text-primary-600">
                
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ContactUs;