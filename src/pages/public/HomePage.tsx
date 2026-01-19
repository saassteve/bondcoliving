import React from 'react';
import { Helmet } from 'react-helmet-async';
import Hero from '../../components/home/Hero';
import Marquee from '../../components/Marquee';
import Intro from '../../components/home/Intro';
import ExploreSpaces from '../../components/home/ExploreSpaces';
import BuildingsOverview from '../../components/home/BuildingsOverview';
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
        <title>Bond Funchal | Premium Nomad Living & Serviced Apartments Madeira | Digital Nomad Housing</title>
        <meta
          name="description"
          content="Bond Funchal: Premium nomad living with private serviced apartments & coworking space for digital nomads in Madeira. Monthly rentals from €1,600 with enterprise WiFi, all utilities, central location. Your independent base in Funchal."
        />
        <meta name="keywords" content="premium nomad living Funchal, digital nomad apartments Madeira, serviced apartments Funchal, serviced apartments Madeira, coworking Funchal, coworking Madeira, digital nomad Funchal, digital nomad Madeira, remote work Madeira, monthly rentals Funchal, furnished apartments Madeira, work from Madeira, digital nomad visa Portugal, Funchal apartments, coworking space Madeira, digital nomad accommodation, long term rentals Madeira, monthly apartment rentals Funchal, premium apartments Funchal" />
        <link rel="canonical" href="https://stayatbond.com/" />

        {/* Open Graph */}
        <meta property="og:title" content="Bond Funchal | Premium Nomad Living & Serviced Apartments Madeira" />
        <meta property="og:description" content="Bond: Premium nomad living with private apartments & coworking in Funchal, Madeira. Independent living from €1,600/month with enterprise WiFi, all utilities, central location. Perfect for digital nomads & remote workers." />
        <meta property="og:url" content="https://stayatbond.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://iili.io/FcOqdX9.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="Bond Funchal" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Bond Funchal | Premium Nomad Living & Serviced Apartments Madeira" />
        <meta name="twitter:description" content="Bond: Premium nomad living with private apartments & coworking in Funchal, Madeira. Independent living from €1,600/month with enterprise WiFi, all utilities, central location. Perfect for digital nomads." />
        <meta name="twitter:image" content="https://iili.io/FcOqdX9.png" />
        <meta name="twitter:site" content="@bondcoliving" />
        <meta name="twitter:creator" content="@bondcoliving" />
      </Helmet>

      <Hero />
      <Marquee />
      <Intro />
      <ExploreSpaces />
      <WhoItsFor />
      <FeatureHighlights />
      <ValueComparison />
      <Reviews />
      <BuildingsOverview />
      <Location />
      <FAQSection />
      <FinalCTA />
    </>
  );
};

export default HomePage;
