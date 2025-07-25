import React from 'react';
import { Helmet } from 'react-helmet-async';
import Hero from '../../components/home/Hero';
import Intro from '../../components/home/Intro';
import ApartmentPreview from '../../components/home/ApartmentPreview';
import ValueComparison from '../../components/home/ValueComparison';
import FeatureHighlights from '../../components/home/FeatureHighlights';
import Reviews from '../../components/home/Reviews';
import WhoItsFor from '../../components/home/WhoItsFor';
import Location from '../../components/home/Location';
import CommunityEvents from '../../components/home/CommunityEvents';
import FinalCTA from '../../components/home/FinalCTA';

const HomePage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Bond - Premium Digital Nomad Coliving in Central Funchal, Madeira | High-Speed WiFi & All Amenities</title>
        <meta 
          name="description" 
          content="Premium coliving for digital nomads in central Funchal, Madeira. Private apartments with enterprise-grade WiFi, coworking space, all amenities included. 5 minutes to ocean & city center. Monthly stays from €1,600."
        />
        <meta name="keywords" content="digital nomad Funchal, coliving Madeira central, remote work Funchal apartments, digital nomad accommodation Madeira, coworking space Funchal, monthly rentals central Funchal, nomad housing Madeira city center, digital nomad community Funchal, work from Madeira, nomad visa Portugal, long term stay Funchal center, digital nomad friendly Madeira" />
        <link rel="canonical" href="https://stayatbond.com/" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Bond - Premium Digital Nomad Coliving in Central Funchal, Madeira" />
        <meta property="og:description" content="Premium coliving for digital nomads in central Funchal. Private apartments, enterprise-grade WiFi, coworking space, all amenities included. 5 minutes to ocean & city center." />
        <meta property="og:url" content="https://stayatbond.com/" />
        <meta property="og:image" content="https://iili.io/FcOqdX9.png" />
        
        {/* Twitter */}
        <meta name="twitter:title" content="Bond - Premium Digital Nomad Coliving in Central Funchal, Madeira" />
        <meta name="twitter:description" content="Premium coliving for digital nomads in central Funchal. Private apartments, enterprise-grade WiFi, coworking space, all amenities included. 5 minutes to ocean & city center." />
        <meta name="twitter:image" content="https://iili.io/FcOqdX9.png" />
      </Helmet>

      <Hero />
      <ApartmentPreview />
      <Intro />
      <ValueComparison />
      <FeatureHighlights />
      <CommunityEvents />
      <Reviews />
      <WhoItsFor />
      <Location />
      <FinalCTA />
    </>
  );
};

export default HomePage;