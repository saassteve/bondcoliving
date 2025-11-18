import React, { useState } from 'react';
import { Plus, Minus, Search, ArrowRight } from 'lucide-react';
import AnimatedSection from './AnimatedSection';

type Category = 'All' | 'Living' | 'Coworking' | 'Community' | 'Booking';

interface FAQItem {
  question: string;
  answer: string;
  category: Exclude<Category, 'All'>;
}

const faqData: FAQItem[] = [
  // Living
  {
    category: 'Living',
    question: "What's included in my apartment?",
    answer: "Every apartment is fully furnished and move-in ready. You get a private ensuite bathroom, a fully equipped kitchenette with induction hob and fridge, a dedicated workspace with an ergonomic chair, and hotel-quality linens. Utilities, high-speed WiFi, and weekly cleaning are all included in the monthly rate."
  },
  {
    category: 'Living',
    question: "Is cleaning service provided?",
    answer: "Yes. We provide a thorough bi-weekly cleaning of your apartment, which includes a change of bed linens and towels. We also clean the communal areas and coworking spaces daily to ensure a spotless environment."
  },
  {
    category: 'Living',
    question: "Is Bond suitable for couples?",
    answer: "Absolutely. Our apartments are designed to comfortably accommodate couples, with double beds and ample storage. There is a small surcharge for a second occupant to cover additional utility and amenity usage."
  },
  {
    category: 'Living',
    question: "Can I have guests or visitors?",
    answer: "Yes, you are welcome to have guests. For overnight stays, we ask that you inform the community manager in advance. Guests can stay for a limited number of nights per month to maintain the balance of our community."
  },
  
  // Coworking
  {
    category: 'Coworking',
    question: "Is the WiFi suitable for remote work?",
    answer: "It is our top priority. We use enterprise-grade fiber internet with 1Gbps speeds and redundancy lines to ensure 100% uptime. The signal is strong in both the private apartments and the coworking area, making it perfect for video calls and heavy data usage."
  },
  {
    category: 'Coworking',
    question: "What is included in the coworking space?",
    answer: "Residents have 24/7 access to our dedicated coworking floor. This includes ergonomic Herman Miller chairs, external monitors (subject to availability), soundproof phone booths for private calls, and a communal kitchen with unlimited specialty coffee and organic tea."
  },
  
  // Community
  {
    category: 'Community',
    question: "What kind of community events do you organize?",
    answer: "We focus on organic connection rather than forced fun. Our weekly rhythm typically includes a community family-style dinner, sunset drinks on the rooftop, and a weekend activity like a levada hike or surf trip. All events are optional but highly recommended."
  },
  {
    category: 'Community',
    question: "What is the age range of residents?",
    answer: "We don't curate by age, but by mindset. However, our average resident is typically between 28 and 45 years old. Most are working professionals, founders, or creatives who value focus during the day and social connection in the evenings."
  },
  
  // Booking
  {
    category: 'Booking',
    question: "What is the minimum stay requirement?",
    answer: "To foster a genuine sense of community, we have a minimum stay policy of one month (30 days). This prevents the 'revolving door' feeling of hostels and allows residents to build real friendships."
  },
  {
    category: 'Booking',
    question: "Do I need a Portuguese visa?",
    answer: "EU citizens do not need a visa. Non-EU citizens typically need a Schengen visa (90 days) or a Digital Nomad Visa for longer stays. We can provide proof of accommodation for your visa application once your booking is confirmed."
  },
  {
    category: 'Booking',
    question: "What if I need to cancel or change my booking?",
    answer: "We offer flexible cancellation policies designed for nomads. If you cancel more than 30 days before arrival, you receive a full refund minus a small processing fee. For changes during your stay, we require 30 days notice."
  },
  {
    category: 'Booking',
    question: "Are there any additional fees?",
    answer: "Transparency is key. Your monthly rate covers rent, all utilities (water, electricity, internet), cleaning, and coworking access. The only potential extra is a one-time end-of-stay deep cleaning fee of €50."
  }
];

const FAQ: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const categories: Category[] = ['All', 'Living', 'Coworking', 'Community', 'Booking'];

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const filteredFAQs = faqData.filter((item) => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section id="faq" className="py-24 bg-[#1E1F1E] relative overflow-hidden">
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />

      <div className="container relative z-10">
        
        {/* Header */}
        <AnimatedSection animation="fadeInUp">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Questions? <br />
              <span className="text-[#C5C5B5]">We have answers.</span>
            </h2>
            <p className="text-xl text-white/60">
              Everything you need to know about life at Bond.
            </p>
          </div>
        </AnimatedSection>

        {/* Controls: Categories & Search */}
        <AnimatedSection animation="fadeInUp" delay={200}>
          <div className="max-w-4xl mx-auto mb-12 flex flex-col md:flex-row gap-6 justify-between items-center">
            
            {/* Category Tabs */}
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setOpenIndex(null);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeCategory === cat
                      ? 'bg-[#C5C5B5] text-[#1E1F1E]'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#C5C5B5]/50 transition-colors placeholder:text-white/30"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            </div>
          </div>
        </AnimatedSection>

        {/* FAQ List */}
        <div className="max-w-3xl mx-auto space-y-4">
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <AnimatedSection 
                  key={index} 
                  animation="fadeInUp" 
                  delay={index * 50} // Staggered entrance
                >
                  <div 
                    className={`group border rounded-2xl transition-all duration-300 overflow-hidden ${
                      isOpen 
                        ? 'bg-white/5 border-[#C5C5B5]/30' 
                        : 'bg-transparent border-white/10 hover:border-white/20'
                    }`}
                  >
                    <button
                      onClick={() => toggleAccordion(index)}
                      className="w-full flex items-start justify-between p-6 text-left"
                    >
                      <span className={`text-lg font-medium transition-colors duration-300 ${
                        isOpen ? 'text-[#C5C5B5]' : 'text-white group-hover:text-white/90'
                      }`}>
                        {item.question}
                      </span>
                      <div className={`ml-4 p-1 rounded-full border transition-all duration-300 ${
                        isOpen 
                          ? 'bg-[#C5C5B5] border-[#C5C5B5] text-[#1E1F1E] rotate-180' 
                          : 'border-white/20 text-white/50 group-hover:border-white/40 group-hover:text-white'
                      }`}>
                        {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </div>
                    </button>
                    
                    <div 
                      className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                        isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-6 pb-6">
                          <p className="text-white/70 leading-relaxed text-base">
                            {item.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              );
            })
          ) : (
            <div className="text-center py-12">
              <p className="text-white/40">No questions found matching "{searchQuery}"</p>
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-4 text-[#C5C5B5] hover:underline text-sm"
              >
                Clear search
              </button>
            </div>
          )}
        </div>

        {/* Contact CTA */}
        <AnimatedSection animation="fadeInUp" delay={400}>
          <div className="text-center mt-20">
            <p className="text-white/60 mb-6">Still have questions?</p>
            <a 
              href="mailto:hello@stayatbond.com"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 bg-white/5 text-white hover:bg-white hover:text-[#1E1F1E] transition-all duration-300 group"
            >
              Contact Support 
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </AnimatedSection>

      </div>
    </section>
  );
};

export default FAQ;