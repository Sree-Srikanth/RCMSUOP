import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import Home from './pages/Home';
import ProjectOverview from './pages/ProjectOverview';
import RCMS from './pages/RCMS';
import ResearchPublications from './pages/ResearchPublications';
import ProjectTeam from './pages/ProjectTeam';
import ContactUs from './pages/ContactUs';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/project-overview" element={<ProjectOverview />} />
            <Route path="/rcms" element={<RCMS />} />
            <Route path="/research-publications" element={<ResearchPublications />} />
            <Route path="/project-team" element={<ProjectTeam />} />
            <Route path="/contact-us" element={<ContactUs />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;