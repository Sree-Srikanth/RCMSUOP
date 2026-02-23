import React from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Heart, 
  Activity, 
  Cpu, 
  Database, 
  Users, 
  Award, 
  GraduationCap,
  Phone,
  BookOpen,
  MapPin,
  Linkedin,
  Globe,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

const ProjectTeam = () => {
  const team = {
    pi: {
      name: "Dr. S. Maheswaran",
      title: "Principal Investigator",
      position: "Senior Lecturer (Grade I)",
      department: "Department of Operations Management",
      faculty: "Faculty of Management",
      email: "mahessiva@mgt.pdn.ac.lk",
      phone: "+94 81 239 4500",
      profileLink: "#dr-maheswaran",
      image: "/team/1.jpg",
      expertise: ["Operations Management", "Healthcare Analytics", "AI in Healthcare"],
      publications: "25+ Peer Reviewed Papers",
      icon: Award,
    },
    coInvestigators: [
      {
        name: "Dr. Upul Jayasinghe",
        position: "Senior Lecturer",
        department: "Department of Computer Engineering",
        faculty: "Faculty of Engineering",
        email: "upul@eng.pdn.ac.lk",
        phone: "+94 81 239 4501",
        profileLink: "#dr-upul",
        image: "/team/2.png",
        expertise: ["Machine Learning", "Computer Engineering", "AI Systems"],
        publications: "20+ Peer Reviewed Papers",
        icon: Cpu,
      },
      {
        name: "Prof. Rajitha Abeysekara",
        position: "Consultant Nephrologist & Senior Lecturer",
        department: "Department of Medicine",
        faculty: "Faculty of Medicine",
        email: "rajitha@med.pdn.ac.lk",
        phone: "+94 81 239 4502",
        profileLink: "#prof-rajitha",
        image: "/team/3.png",
        expertise: ["Nephrology", "Clinical Research", "Renal Care"],
        publications: "30+ Peer Reviewed Papers",
        icon: Heart,
      },
      {
        name: "Dr. Nadisha Piyarathne",
        position: "Senior Lecturer",
        department: "Department of Basic Sciences",
        faculty: "Faculty of Dental Sciences",
        email: "nadisha@dental.pdn.ac.lk",
        phone: "+94 81 239 4503",
        profileLink: "#dr-nadisha",
        image: "/team/4.png",
        expertise: ["Basic Sciences", "Dental Research", "Clinical Education"],
        publications: "15+ Peer Reviewed Papers",
        icon: Activity,
      },
      {
        name: "Dr. Hakim A. Usoof",
        position: "Head of the Department / Senior Lecturer",
        department: "Department of Statistics & Computer Science",
        faculty: "Faculty of Science",
        email: "hakim@sci.pdn.ac.lk",
        phone: "+94 81 239 4504",
        profileLink: "#dr-hakim",
        image: "/team/5.png",
        expertise: ["Statistics", "Computer Science", "Data Analytics"],
        publications: "18+ Peer Reviewed Papers",
        icon: Database,
      },
      {
        name: "Dr. S. Krishnapradeep",
        position: "Senior Lecturer",
        department: "Department of Paediatrics",
        faculty: "Faculty of Medicine",
        email: "krishna@med.pdn.ac.lk",
        phone: "+94 81 239 4505",
        profileLink: "#dr-krishna",
        image: "/team/6.png",
        expertise: ["Paediatrics", "Child Health", "Clinical Research"],
        publications: "22+ Peer Reviewed Papers",
        icon: BookOpen,
      },
    ],
    researchAssistants: [
      {
        name: "Mr. A. Mithursan",
        role: "Full-time Research Assistant",
        period: "15.09.2025 – 14.09.2026",
        affiliation: "University Research Council, UoP",
        email: "mithursan@urc.pdn.ac.lk",
        profileLink: "#mithursan",
        image: "/team/7.png",
        expertise: ["Data Collection", "Clinical Coordination", "Research Methodology"],
        icon: GraduationCap,
      },
      {
        name: "Ms. Vidu Fernando",
        role: "Part-time Research Assistant",
        qualification: "BSc.(Hons) in Computer Science",
        affiliation: "University of Peradeniya",
        email: "vidu@cs.pdn.ac.lk",
        profileLink: "#vidu",
        image: "/team/8.jpg",
        expertise: ["Frontend Development", "UI/UX Design", "System Integration"],
        icon: GraduationCap,
      },
    ],
  };

  // Combine PI and Co-Investigators for two-row layout
  const allInvestigators = [team.pi, ...team.coInvestigators];

  // Profile Card with Circular Image
  const ProfileCard = ({ member, isPrincipal = false }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
    >
      {/* Decorative top gradient */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-primary-600 to-secondary-600 opacity-90"></div>
      
      {/* Circular Profile Image */}
      <div className="relative flex justify-center pt-8">
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
            <img 
              src={member.image}
              alt={member.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=0D9488&color=fff&size=128`;
              }}
            />
          </div>
          {/* Icon Badge */}
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-secondary-500 rounded-full flex items-center justify-center border-4 border-white">
            <member.icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pt-4 pb-6 text-center">
        {/* Name with Profile Link */}
        <a 
          href={member.profileLink}
          onClick={(e) => {
            e.preventDefault();
            window.location.hash = member.profileLink.substring(1);
          }}
          className="inline-block group-hover:text-secondary-600 transition-colors"
        >
          <h3 className="text-xl font-bold text-gray-900 hover:text-secondary-600">
            {member.name}
            <ExternalLink className="inline-block w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h3>
        </a>
        
        {/* Title/Position */}
        {isPrincipal && (
          <p className="mt-1 text-sm font-semibold text-secondary-600">{member.title}</p>
        )}
        <p className="mt-1 text-sm text-gray-600">{member.position}</p>
        
        {/* Department */}
        <p className="mt-2 text-xs text-gray-500 line-clamp-2">{member.department}</p>
        <p className="text-xs text-gray-400">{member.faculty}</p>

        {/* Expertise Tags */}
        <div className="flex flex-wrap justify-center gap-1 mt-3">
          {member.expertise.slice(0, 2).map((item, idx) => (
            <span 
              key={idx} 
              className="px-2 py-1 text-xs font-medium bg-primary-50 text-primary-700 rounded-full"
            >
              {item}
            </span>
          ))}
          {member.expertise.length > 2 && (
            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
              +{member.expertise.length - 2}
            </span>
          )}
        </div>

        {/* Publications */}
        <div className="flex items-center justify-center mt-3 text-xs text-gray-600">
          <BookOpen className="w-3 h-3 mr-1 text-secondary-500" />
          <span>{member.publications}</span>
        </div>

        {/* Contact Info - Simple */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <a 
            href={`mailto:${member.email}`}
            className="flex items-center justify-center text-xs text-gray-600 hover:text-primary-600 transition-colors"
          >
            <Mail className="w-3 h-3 mr-1" />
            <span className="truncate">{member.email}</span>
          </a>
          <a 
            href={`tel:${member.phone}`}
            className="flex items-center justify-center mt-1 text-xs text-gray-600 hover:text-primary-600 transition-colors"
          >
            <Phone className="w-3 h-3 mr-1" />
            <span>{member.phone}</span>
          </a>
        </div>
      </div>
    </motion.div>
  );

  // Research Assistant Card
  const AssistantCard = ({ member }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-start space-x-4">
          {/* Circular Image */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-3 border-secondary-200 overflow-hidden">
                <img 
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=0D9488&color=fff&size=80`;
                  }}
                />
              </div>
              <div className="w-24 h-1 rounded-full bg-gradient-to-r from-blue-800 via-blue-600 to-gray-300"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <GraduationCap className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            {/* Name with Profile Link */}
            <a 
              href={member.profileLink}
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = member.profileLink.substring(1);
              }}
              className="inline-block group"
            >
              <h3 className="text-lg font-bold text-gray-900 hover:text-secondary-600 transition-colors">
                {member.name}
                <ExternalLink className="inline-block w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
            </a>
            <p className="text-sm font-medium text-secondary-600">{member.role}</p>
            
            {/* Details */}
            {member.period && (
              <p className="mt-1 text-xs text-gray-500">{member.period}</p>
            )}
            {member.qualification && (
              <p className="text-xs text-gray-500">{member.qualification}</p>
            )}
            <p className="text-xs text-gray-500">{member.affiliation}</p>

            {/* Expertise Tags */}
            <div className="flex flex-wrap gap-1 mt-2">
              {member.expertise.map((item, idx) => (
                <span key={idx} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                  {item}
                </span>
              ))}
            </div>

            {/* Email */}
            <a 
              href={`mailto:${member.email}`}
              className="inline-flex items-center mt-2 text-xs text-primary-600 hover:text-primary-700 transition-colors"
            >
              <Mail className="w-3 h-3 mr-1" />
              {member.email}
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="py-12 mt-10 container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-12 text-center"
        >
          {/* Decorative Circles */}
          <div className="absolute left-0 w-64 h-64 rounded-full top-10 -left-20 bg-primary-100 opacity-20"></div>
          <div className="absolute rounded-full w-96 h-96 -bottom-20 -right-20 bg-secondary-100 opacity-20"></div>
          
          <h1 className="relative mt-5 text-5xl font-bold md:text-6xl text-primary-900">
            Project Team
          </h1>
          <div className="flex justify-center mt-4 mb-4">
           <div className="w-24 h-1 rounded-full bg-gradient-to-r from-blue-800 via-blue-600 to-gray-300"></div>
          </div>
          <p className="relative text-xl text-gray-600 max-w-3xl mx-auto">
            Multi-disciplinary expertise from University of Peradeniya
          </p>
        </motion.div>

        {/* Investigators Section - Two Rows, Three Columns */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-16"
        >
          <h2 className="flex items-center mb-8 text-3xl font-bold text-primary-900">
            <Users className="w-8 h-8 mr-3 text-secondary-500" />
            Principal & Co-Investigators
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {allInvestigators.map((member, index) => (
              <ProfileCard 
                key={index} 
                member={member} 
                isPrincipal={index === 0}
              />
            ))}
          </div>

          {/* Investigator Count Badge */}
          <div className="flex justify-center mt-8">
            <div className="inline-flex items-center px-4 py-2 bg-primary-50 rounded-full">
              <span className="text-sm font-medium text-primary-700">
                {allInvestigators.length} Investigators • 6 Departments • 5 Faculties
              </span>
            </div>
          </div>
        </motion.div>

        {/* Research Assistants */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="flex items-center mb-8 text-3xl font-bold text-primary-900">
            <GraduationCap className="w-8 h-8 mr-3 text-secondary-500" />
            Research Assistants
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            {team.researchAssistants.map((assistant, index) => (
              <AssistantCard key={index} member={assistant} />
            ))}
          </div>
        </motion.div>

        {/* Affiliation Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative p-8 text-center text-white bg-gradient-to-r from-primary-900 to-primary-800 rounded-2xl overflow-hidden"
        >
          {/* Decorative Circles */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white opacity-5 translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white opacity-5 -translate-x-32 translate-y-32"></div>
          
          <div className="relative">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                <Award className="w-8 h-8 text-secondary-300" />
              </div>
            </div>
            <p className="text-2xl font-bold mb-2">
              University of Peradeniya
            </p>
            <p className="text-lg text-gray-200 max-w-2xl mx-auto">
              All investigators are affiliated with the University of Peradeniya, bringing multidisciplinary expertise across management, engineering, medicine, dental sciences, and science faculties.
            </p>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mt-8 md:grid-cols-4">
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <div className="text-2xl font-bold text-primary-700">{allInvestigators.length}</div>
            <div className="text-sm text-gray-600">Investigators</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <div className="text-2xl font-bold text-primary-700">5</div>
            <div className="text-sm text-gray-600">Faculties</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <div className="text-2xl font-bold text-primary-700">6</div>
            <div className="text-sm text-gray-600">Departments</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <div className="text-2xl font-bold text-primary-700">2</div>
            <div className="text-sm text-gray-600">Research Assistants</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectTeam;