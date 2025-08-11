import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import AnimatedSection from './AnimatedSection';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "What's included in my apartment?",
    answer: "Every apartment comes fully furnished with everything you need for comfortable living. This includes fresh bed linens and towels, a fully equipped kitchen with pots, pans, cutlery, crockery, and all cooking essentials. You'll also have a private bathroom with toiletries, high-speed WiFi, all utilities (electricity, water, heating), and access to our coworking space. We provide weekly cleaning service and fresh linens every fortnight."
  },
  {
    question: "What's the minimum stay requirement?",
    answer: "We require a minimum stay of one month (30 days). This allows you to properly settle into the community and experience the full benefits of coliving. Many of our residents stay for 3-6 months or longer, and we offer discounts for extended stays."
  },
  {
    question: "Is WiFi suitable for remote work?",
    answer: "Absolutely. We provide enterprise-grade internet with speeds up to 1Gbps, perfect for video calls, large file uploads, and any professional requirements. Each apartment has dedicated WiFi access, and our coworking space has additional high-speed connections for backup."
  },
  {
    question: "What cleaning services are provided?",
    answer: "We provide bi-weekly professional cleaning service for all apartments, including fresh bed linens and towels. Common areas are cleaned daily. We also offer weekly laundry service for your personal items. All cleaning supplies and toiletries are restocked regularly."
  },
  {
    question: "Where exactly are you located in Funchal?",
    answer: "We're situated in central Funchal, just a 5-minute walk from the ocean promenade and city centre. You'll be within walking distance of cafes, restaurants, shops, and public transport. The location offers the perfect balance of urban convenience and coastal charm."
  },
  {
    question: "What's included in the coworking space?",
    answer: "Our coworking space (opening August 2025) features ergonomic workstations, high-speed WiFi, printing facilities, meeting rooms, and a coffee station. It's designed specifically for digital nomads and remote workers, with 24/7 access for monthly members. Day, weekly, and monthly passes will be available."
  },
  {
    question: "Are there any additional fees?",
    answer: "No hidden fees whatsoever. Your monthly rate includes absolutely everything: rent, all utilities, WiFi, cleaning service, laundry service, fresh linens, toiletries, coworking space access, and community events. The only additional cost might be personal items or dining out."
  },
  {
    question: "What kind of community events do you organise?",
    answer: "We host regular community events including weekend hikes exploring Madeira's levadas, skill-sharing sessions where residents teach each other, coffee and coworking mornings, photography walks around Funchal, and occasional social dinners. All events are optional and designed to foster genuine connections."
  },
  {
    question: "Can I have guests or visitors?",
    answer: "Yes, you can have guests visit during reasonable hours. For overnight guests, please let us know in advance so we can ensure it doesn't impact other residents. Extended guest stays may incur additional fees, which we'll discuss with you beforehand."
  },
  {
    question: "What's the booking process?",
    answer: "Simply fill out our booking form with your preferred dates and apartment choice. We'll confirm availability within 48 hours and send you a booking agreement. A deposit secures your space, with the balance due before arrival. We'll provide all arrival details, door codes, and local recommendations before you arrive."
  },
  {
    question: "Do you provide airport transfers?",
    answer: "We can arrange airport transfers for an additional fee, or provide detailed instructions for public transport (about 30 minutes by bus) or taxi services. Many residents find the bus journey a lovely introduction to the island."
  },
  {
    question: "What if I need to cancel or change my booking?",
    answer: "We understand plans can change. Cancellations made more than 30 days before arrival receive a full refund minus a small processing fee. Changes to dates are subject to availability. We'll work with you to find the best solution if circumstances change."
  },
  {
    question: "Is Bond suitable for couples?",
    answer: "Absolutely! Many of our apartments are perfect for couples, with comfortable double beds and spacious layouts. Some apartments can accommodate two people, and we have options specifically designed for couples who want to experience coliving together."
  },
  {
    question: "What's the age range of residents?",
    answer: "Our residents are typically between 25-45 years old, though we welcome anyone who shares our values of community, respect, and professional growth. What matters most is that you're a considerate person who values both independence and meaningful connections."
  },
  {
    question: "Do I need a Portuguese visa or residency permit?",
    answer: "Visa requirements depend on your nationality and length of stay. EU citizens can stay freely, whilst others may need tourist visas or Portugal's Digital Nomad Visa for longer stays. We're happy to provide accommodation letters for visa applications, but please check current requirements with Portuguese authorities."
  }
];

const FAQSection: React.FC = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <section className="py-24 bg-[#1E1F1E]">
      <div className="container">
        <AnimatedSection animation="fadeInUp">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="mb-8">
              <p className="text-sm uppercase tracking-[0.2em] text-[#C5C5B5]/60 font-medium mb-4">
                Questions & Answers
              </p>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] bg-clip-text text-transparent">
                  Frequently Asked Questions
                </span>
              </h2>
            </div>
            <p className="text-xl text-[#C5C5B5]/80">
              Everything you need to know about living and working at Bond.
            </p>
          </div>
        </AnimatedSection>

        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <AnimatedSection
                key={index}
                animation="fadeInUp"
                delay={index * 100}
                className="bg-[#C5C5B5]/5 rounded-2xl border border-[#C5C5B5]/10 overflow-hidden hover:bg-[#C5C5B5]/10 transition-all duration-300"
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-6 md:px-8 py-6 text-left flex items-center justify-between focus:outline-none group"
                >
                  <h3 className="text-lg md:text-xl font-bold text-[#C5C5B5] pr-4 group-hover:text-white transition-colors">
                    {faq.question}
                  </h3>
                  <div className="flex-shrink-0">
                    {openItems.includes(index) ? (
                      <Minus className="w-5 h-5 text-[#C5C5B5] group-hover:text-white transition-colors" />
                    ) : (
                      <Plus className="w-5 h-5 text-[#C5C5B5] group-hover:text-white transition-colors" />
                    )}
                  </div>
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openItems.includes(index) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="px-6 md:px-8 pb-6">
                    <div className="border-t border-[#C5C5B5]/10 pt-4">
                      <p className="text-[#C5C5B5]/80 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>

          {/* Contact CTA */}
          <AnimatedSection animation="fadeInUp" delay={faqData.length * 100 + 200}>
            <div className="text-center mt-16">
              <div className="bg-[#C5C5B5]/5 rounded-2xl p-8 border border-[#C5C5B5]/10">
                <h3 className="text-2xl font-bold text-[#C5C5B5] mb-4">
                  Still have questions?
                </h3>
                <p className="text-[#C5C5B5]/80 mb-6">
                  We're here to help. Get in touch and we'll answer any questions about your stay.
                </p>
                <a 
                  href="mailto:hello@stayatbond.com?subject=Question about Bond Coliving"
                  className="inline-flex items-center px-8 py-4 bg-[#C5C5B5] text-[#1E1F1E] rounded-full hover:bg-white transition-all font-semibold text-sm uppercase tracking-wide shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Contact Us
                </a>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;