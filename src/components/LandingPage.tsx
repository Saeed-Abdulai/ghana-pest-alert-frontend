// ============================================================================
// LANDING PAGE COMPONENT
// Public landing page for the Ghana Pest Alert System
// ============================================================================

import React from 'react';
import {
  Leaf,
  Shield,
  Bell,
  Users,
  Bot,
  MessageSquare,
  CheckCircle,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import LoginModal from '@/components/shared/LoginModal';
import RegisterModal from '@/components/shared/RegisterModal';

interface LandingPageProps {
  onLogin: () => void;
}

const HERO_IMAGE = 'https://d64gsuwffb70l.cloudfront.net/695a5992bb416dd5fc1f4ad4_1767528976051_a497df61.png';

const OFFICER_IMAGES = [
  'https://d64gsuwffb70l.cloudfront.net/695a5992bb416dd5fc1f4ad4_1767529025970_4b72b7ba.png',
  'https://d64gsuwffb70l.cloudfront.net/695a5992bb416dd5fc1f4ad4_1767529013696_7e1a3e32.jpg',
  'https://d64gsuwffb70l.cloudfront.net/695a5992bb416dd5fc1f4ad4_1767529029462_fc1ca010.png'
];

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const features = [
    {
      icon: <Bot className="w-6 h-6" />,
      title: 'AI-Powered Detection',
      description: 'GPT-4 analyzes pest symptoms and generates accurate identification with preventive measures.',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Expert Validation',
      description: 'Extension officers verify all AI recommendations before they reach farmers.',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'SMS Alerts',
      description: 'Instant SMS notifications to farmers in rural areas without internet access.',
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: 'Push Notifications',
      description: 'Real-time push alerts for farmers with smartphones and internet connectivity.',
      color: 'bg-amber-100 text-amber-600'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Farmer Network',
      description: 'Connect with extension officers and access a community of farmers across Ghana.',
      color: 'bg-red-100 text-red-600'
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: 'Verified Information',
      description: 'Human-in-the-loop validation ensures accurate and reliable pest control advice.',
      color: 'bg-teal-100 text-teal-600'
    }
  ];

  const stats = [
    { value: '1,200+', label: 'Registered Farmers' },
    { value: '24', label: 'Extension Officers' },
    { value: '156', label: 'Pest Alerts Issued' },
    { value: '16', label: 'Regions Covered' }
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-gray-900">Ghana Pest Alert</span>
                <span className="hidden sm:inline text-gray-500 text-sm ml-2">Agricultural Protection System</span>
              </div>
            </div>

            {/* Nav links — How It Works removed */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Features</a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Contact</a>
            </div>

            <button
              onClick={onLogin}
              className="px-5 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-6">
                <Shield className="w-4 h-4" />
                Protecting Ghana's Agriculture
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                AI-Powered
                <span className="text-green-600"> Pest Alert</span>
                <br />System for Farmers
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-lg">
                Empowering Ghanaian farmers with real-time pest detection, expert-validated recommendations, and instant SMS alerts to protect crops and livelihoods.
              </p>
              {/* Learn More button removed — only Get Started remains */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={onLogin}
                  className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Hero image */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={HERO_IMAGE}
                  alt="Ghana Agriculture"
                  className="w-full h-auto"
                />
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Bell className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Active Alert</p>
                      <p className="text-sm text-gray-500">Fall Armyworm detected in Ashanti Region</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-white">{stat.value}</p>
                <p className="text-green-100 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Pest Management
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our system combines artificial intelligence with human expertise to deliver accurate, timely pest alerts to farmers across Ghana.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Extension Officers Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Expert Extension Officers
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Our network of trained agricultural extension officers ensures that every pest alert is accurate, relevant, and actionable for farmers.
              </p>
              <ul className="space-y-4">
                {[
                  'Verify AI-generated pest identifications',
                  'Customize recommendations for local conditions',
                  'Provide direct support to farmers',
                  'Monitor regional pest patterns'
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center">
              <div className="flex -space-x-4">
                {OFFICER_IMAGES.map((img, index) => (
                  <div key={index} className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-lg overflow-hidden">
                    <img src={img} alt={`Extension Officer ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Protect Your Crops?
          </h2>
          <p className="text-lg text-green-100 mb-8 max-w-2xl mx-auto">
            Join thousands of Ghanaian farmers who receive timely pest alerts and expert recommendations to safeguard their harvests.
          </p>
          <button
            onClick={onLogin}
            className="px-8 py-4 bg-white text-green-600 font-semibold rounded-xl hover:bg-green-50 transition-colors inline-flex items-center gap-2"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-xl">Ghana Pest Alert</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Empowering Ghanaian farmers with AI-powered pest detection and expert-validated recommendations to protect crops and livelihoods.
              </p>
            </div>

            {/* Contact — unchanged from original */}
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>+233 30 123 4567</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>info@pestalert.gh</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Accra, Ghana</span>
                </li>
              </ul>
            </div>

            {/* Quick Links — How It Works removed */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><button onClick={onLogin} className="hover:text-white">Sign In</button></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Ghana Pest Alert System. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;