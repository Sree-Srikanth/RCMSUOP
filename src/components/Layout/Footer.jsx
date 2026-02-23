import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="pt-12 pb-6 text-white bg-primary-950">
      <div className="container-custom">
        <div className="grid gap-8 mb-8 md:grid-cols-4">
          <div>
            <div className="flex items-center mb-4 space-x-2">
              <Heart className="w-6 h-6 text-secondary-500" />
              <span className="text-lg font-bold">Grant No: URC 515</span>
            </div>
            <p className="text-sm text-gray-300">
              Multi-Disciplinary Research Grant · 2024-2026
            </p>
            <p className="mt-2 text-sm text-gray-300">
              University of Peradeniya, Sri Lanka
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link to="/project-overview" className="hover:text-secondary-500">Project Overview</Link></li>
              <li><Link to="/rcms" className="hover:text-secondary-500">RCMS System</Link></li>
              <li><Link to="/research-publications" className="hover:text-secondary-500">Publications</Link></li>
              <li><Link to="/project-team" className="hover:text-secondary-500">Research Team</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start">
                <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>Faculty of Management, University of Peradeniya</span>
              </li>
              <li className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                <a href="mailto:mahessiva@mgt.pdn.ac.lk" className="hover:text-secondary-500">
                  mahessiva@mgt.pdn.ac.lk
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">Ethics Approval</h3>
            <p className="text-sm text-gray-300">ERC No: 2024/EC/49</p>
            <p className="mt-2 text-sm text-gray-300">PROSPERO: CRD42024596375</p>
          </div>
        </div>

        <div className="pt-6 text-sm text-center text-gray-400 border-t border-white/20">
          <p>© 2025 Developed by IT Center, University of Peradeniya. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;