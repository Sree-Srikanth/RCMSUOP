import React from 'react';
import Hero from '../components/Home/Hero';
import KeyHighlights from '../components/Home/KeyHighlights';
import QuickStats from '../components/Home/QuickStats';
import ResearchImpact from '../components/Home/ResearchImpact';
import SystemPreview from '../components/Home/SystemPreview';

const Home = () => {
  return (
    <main>
      <Hero />
      <KeyHighlights />
      <QuickStats />
      <ResearchImpact />
      <SystemPreview />
    </main>
  );
};

export default Home;