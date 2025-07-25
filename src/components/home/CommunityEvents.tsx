import React from 'react';
import { Calendar, Users, Mountain, Coffee, Lightbulb, Camera, Utensils, Music } from 'lucide-react';
import AnimatedSection from '../AnimatedSection';

const events = [
  {
    icon: Mountain,
    title: 'Weekend Hikes',
    description: 'Explore Madeira\'s stunning levadas and mountain trails with fellow nomads.',
    frequency: 'Every Saturday',
    time: '9:00 AM'
  },
  {
    icon: Lightbulb,
    title: 'Skill Sharing Sessions',
    description: 'Share your expertise and learn from others in our weekly knowledge exchange.',
    frequency: 'Every Wednesday',
    time: '7:00 PM'
  },
  {
    icon: Coffee,
    title: 'Coffee & Cowork',
    description: 'Start your day with great coffee and productive energy alongside the community.',
    frequency: 'Daily',
    time: '8:00 AM'
  },
  {
    icon: Utensils,
    title: 'Community Dinners',
    description: 'Enjoy home-cooked meals and meaningful conversations with your housemates.',
    frequency: 'Every Friday',
    time: '7:30 PM'
  },
  {
    icon: Camera,
    title: 'Photography Walks',
    description: 'Capture Funchal\'s beauty while exploring hidden gems with fellow creatives.',
    frequency: 'Bi-weekly',
    time: '6:00 PM'
  },
  {
    icon: Music,
    title: 'Music & Arts Night',
    description: 'Showcase your talents or enjoy performances in our relaxed evening gatherings.',
    frequency: 'Monthly',
    time: '8:00 PM'
  }
];

const CommunityEvents: React.FC = () => {
  return (
    <section className="py-24 bg-[#1E1F1E]">
      <div className="container">
        <AnimatedSection animation="fadeInUp">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="mb-8">
              <p className="text-sm uppercase tracking-[0.2em] text-[#C5C5B5]/60 font-medium mb-4">
                Community & Connection
              </p>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-[#C5C5B5] via-white to-[#C5C5B5] bg-clip-text text-transparent">
                  More Than Just a Place to Stay
                </span>
              </h2>
            </div>
            <p className="text-xl text-[#C5C5B5]/80">
              Join a community that values both meaningful work and authentic connections. 
              Our regular events foster collaboration, creativity, and lasting friendships.
            </p>
          </div>
        </AnimatedSection>

        {/* Community Ethos */}
        <AnimatedSection animation="fadeInUp" delay={200}>
          <div className="max-w-4xl mx-auto mb-16">
            <div className="bg-[#C5C5B5]/5 rounded-3xl p-8 md:p-12 border border-[#C5C5B5]/10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <Users className="w-8 h-8 text-[#C5C5B5] mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-[#C5C5B5] mb-3">Intentional Community</h3>
                  <p className="text-[#C5C5B5]/80 text-sm">
                    We believe in quality over quantity. Our small, curated community ensures meaningful connections.
                  </p>
                </div>
                <div>
                  <Lightbulb className="w-8 h-8 text-[#C5C5B5] mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-[#C5C5B5] mb-3">Growth Mindset</h3>
                  <p className="text-[#C5C5B5]/80 text-sm">
                    Learn from diverse professionals, share your skills, and grow both personally and professionally.
                  </p>
                </div>
                <div>
                  <Mountain className="w-8 h-8 text-[#C5C5B5] mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-[#C5C5B5] mb-3">Work-Life Harmony</h3>
                  <p className="text-[#C5C5B5]/80 text-sm">
                    Balance focused productivity with island adventures and community experiences.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Events Grid */}
        <div className="max-w-6xl mx-auto">
          <AnimatedSection animation="fadeInUp" delay={400}>
            <div className="text-center mb-12">
              <h3 className="text-2xl font-bold text-[#C5C5B5] mb-4">Regular Community Events</h3>
              <p className="text-[#C5C5B5]/80">
                From skill sharing to island adventures, there's always something happening at Bond.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => {
              const Icon = event.icon;
              return (
                <AnimatedSection
                  key={index}
                  animation="fadeInUp"
                  delay={600 + (index * 100)}
                  className="bg-[#C5C5B5]/5 rounded-2xl p-6 border border-[#C5C5B5]/10 hover:bg-[#C5C5B5]/10 transition-all duration-300 hover:transform hover:-translate-y-1"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#C5C5B5]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-[#C5C5B5]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-[#C5C5B5] mb-2">{event.title}</h4>
                      <p className="text-[#C5C5B5]/80 text-sm mb-3 leading-relaxed">{event.description}</p>
                      <div className="flex items-center gap-4 text-xs text-[#C5C5B5]/60">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{event.frequency}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>•</span>
                          <span>{event.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>

        {/* Call to Action */}
        <AnimatedSection animation="fadeInUp" delay={1200}>
          <div className="text-center mt-16">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold mb-4 text-[#C5C5B5]">
                Ready to join our community?
              </h3>
              <p className="text-[#C5C5B5]/80 text-lg leading-relaxed mb-8">
                Experience the perfect balance of productivity, adventure, and meaningful connections 
                in the heart of Funchal.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="/apply" 
                  className="inline-flex items-center px-8 py-4 bg-[#C5C5B5] text-[#1E1F1E] rounded-full hover:bg-white transition-all font-semibold text-lg uppercase tracking-wide shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Apply to Join
                </a>
                <a 
                  href="/about" 
                  className="inline-flex items-center px-8 py-4 bg-[#C5C5B5]/10 text-[#C5C5B5] rounded-full hover:bg-[#C5C5B5]/20 transition-all font-semibold text-lg uppercase tracking-wide border border-[#C5C5B5]/20"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default CommunityEvents;