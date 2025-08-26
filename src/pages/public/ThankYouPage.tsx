import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowLeft } from 'lucide-react';

const ThankYouPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Application Submitted - Thank You | Bond Coliving Madeira</title>
        <meta name="description" content="Thank you for your application to Bond Coliving in Funchal, Madeira. We'll review your submission and get back to you within 48 hours." />
        <meta name="robots" content="noindex" />
        <link rel="canonical" href="https://stayatbond.com/thank-you" />
      </Helmet>
      
      <div className="container py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-6 flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          
          <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
          
          <div className="bg-white p-8 rounded-lg shadow-sm mb-8">
            <p className="text-lg mb-6">
              Your request has been successfully submitted. We'll review it and get back to you within 48 hours with available options.
            </p>
            
            <p className="text-gray-600 mb-6">
              We'll work with you to find the perfect apartment that matches your needs and dates. In the meantime, feel free to explore more about our space.
            </p>
            
            <div className="flex flex-col space-y-4">
              <Link to="/" className="btn-primary">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Homepage
              </Link>
              
              <Link to="/coworking" className="btn-secondary">
                Explore Coworking Options
              </Link>
            </div>
          </div>
          
          <p className="text-sm text-gray-500">
            If you have any questions, please contact us at hello@stayatbond.com
          </p>
        </div>
      </div>
    </>
  );
};

export default ThankYouPage;