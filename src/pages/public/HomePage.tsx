import React from 'react';
import { Helmet } from 'react-helmet-async';
import Hero from '../../components/home/Hero';
import Marquee from '../../components/Marquee';
import Intro from '../../components/home/Intro';
import BuildingsOverview from '../../components/home/BuildingsOverview';
import ApartmentPreview from '../../components/home/ApartmentPreview';
import ValueComparison from '../../components/home/ValueComparison';
import FeatureHighlights from '../../components/home/FeatureHighlights';
import Reviews from '../../components/home/Reviews';
import WhoItsFor from '../../components/home/WhoItsFor';
import Location from '../../components/home/Location';
import FinalCTA from '../../components/home/FinalCTA';
import FAQSection from '../../components/FAQSection';

const HomePage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Bond Coliving Funchal | Premium Serviced Apartments & Coworking Madeira | Digital Nomad Housing</title>
        <meta
          name="description"
          content="Bond Coliving Funchal: Premium serviced apartments & coworking space for digital nomads in Madeira. Monthly rentals from €1,600 with high-speed WiFi, all utilities, central location. Book your coliving experience in Funchal today."
        />
        <meta name="keywords" content="coliving Funchal, coliving Madeira, coworking Funchal, coworking Madeira, serviced apartments Funchal, serviced apartments Madeira, digital nomad Funchal, digital nomad Madeira, remote work Madeira, monthly rentals Funchal, furnished apartments Madeira, coliving space Funchal, work from Madeira, digital nomad visa Portugal, Madeira coliving, Funchal apartments, coworking space Madeira, digital nomad accommodation, long term rentals Madeira, monthly apartment rentals Funchal" />
        <link rel="canonical" href="https://stayatbond.com/" />

        {/* Open Graph */}
        <meta property="og:title" content="Bond Coliving Funchal | Premium Serviced Apartments & Coworking Madeira" />
        <meta property="og:description" content="Bond: Premium coliving & coworking in Funchal, Madeira. Serviced apartments from €1,600/month with enterprise WiFi, all utilities, central location. Perfect for digital nomads & remote workers." />
        <meta property="og:url" content="https://stayatbond.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://iili.io/FcOqdX9.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="Bond Coliving Funchal" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Bond Coliving Funchal | Serviced Apartments & Coworking Madeira" />
        <meta name="twitter:description" content="Bond: Premium coliving & coworking in Funchal, Madeira. Serviced apartments from €1,600/month with enterprise WiFi, all utilities, central location. Perfect for digital nomads." />
        <meta name="twitter:image" content="https://iili.io/FcOqdX9.png" />
        <meta name="twitter:site" content="@bondcoliving" />
        <meta name="twitter:creator" content="@bondcoliving" />
      </Helmet>

      <Hero />
      <Marquee />
      <ApartmentPreview />
      <Intro />
      <BuildingsOverview />
      <ValueComparison />
      <FeatureHighlights />
      <Reviews />
      <WhoItsFor />
      <Location />
      <FAQSection />
      <FinalCTA />
    </>
  );
};

export default HomePage;