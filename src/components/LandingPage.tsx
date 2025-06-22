"use client";
import React, { useState, useEffect } from 'react';
import '../styles/sunray.css'
import { 
  FileText, 
  BarChart2, 
  ArrowRight, 
  LineChart, 
  PieChart, 
  Brain,
  Zap,
  Upload,
  BarChart,
  Table,
  MessageSquare,
  CheckCircle2,
  ArrowUpRight,
  X,
  Sun,
  Moon
} from 'lucide-react';
import { useDataStore } from '../store/dataStore';
import { Spotlight } from './Spotlight';
import { motion } from 'framer-motion';
import dataGif from '../lib/data.gif';
import { Login } from './Login';

// Theme colors defined in CSS variables

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const features = [
  {
    icon: <BarChart2 className="h-5 w-5 text-blue-600" />,
    title: "Data Engineering & Migration",
    description: "Data pipeline development, data integration, and ETL. Seamless cloud migration services for digital transformation."
  },
  {
    icon: <Brain className="h-5 w-5 text-blue-600" />,
    title: "Advanced Analytics & BI",
    description: "Comprehensive BI solutions for data visualization and reporting. Real-time analytics and inference for dynamic decision-making."
  },
  {
    icon: <Zap className="h-5 w-5 text-blue-600" />,
    title: "AI & Machine Learning",
    description: "AI/ML model development including Generative AI, predictive analytics, and time series forecasting solutions."
  },
  {
    icon: <Upload className="h-5 w-5 text-blue-600" />,
    title: "Cloud-based Solutions",
    description: "Scalable cloud-based data platforms and analytics tools with end-to-end support for digital transformation."
  },
  {
    icon: <MessageSquare className="h-5 w-5 text-blue-600" />,
    title: "NLP & Virtual Assistants",
    description: "Natural Language Processing solutions including virtual assistants and conversational AI for enhanced user experiences."
  },
  {
    icon: <Table className="h-5 w-5 text-blue-600" />,
    title: "Support & Maintenance",
    description: "24/7 monitoring, troubleshooting, and engineering support with advanced model optimization and tuning."
  }
];

const visualizations = [
  {
    icon: <BarChart2 className="h-5 w-5 text-blue-600" />,
    title: "Distribution Analysis",
    description: "Understand the spread and patterns in your numerical data"
  },
  {
    icon: <LineChart className="h-5 w-5 text-blue-600" />,
    title: "Time Series Analysis",
    description: "Track trends and patterns over time"
  },
  {
    icon: <PieChart className="h-5 w-5 text-blue-600" />,
    title: "Category Comparison",
    description: "Compare proportions and distributions across categories"
  }
];

const benefits = [
  {
    title: "Enhanced Transparency & Accountability",
    description: "Gain clear understanding of your data maturity level, demonstrating transparency to stakeholders and regulators"
  },
  {
    title: "Single Source of Truth",
    description: "Centralize your data for deeper insights, scalability, and consistency across your organization"
  },
  {
    title: "Cost Savings & Scalability",
    description: "Reduce operational costs with flexible, pay-as-you-go pricing model and eliminate on-premise hardware"
  },
  {
    title: "Improved Data Quality",
    description: "Assign clear ownership of data products ensuring high quality, better governance, and enhanced security"
  },
  {
    title: "Faster Data Processing",
    description: "Eliminate bottlenecks by decentralizing data ownership, speeding up processing and decision-making"
  },
  {
    title: "Advanced Business Insights",
    description: "Leverage 360-degree view of your business to drive better insights and manage risks proactively"
  }
];

export const LandingPage: React.FC = () => {
  const processedData = useDataStore(state => state.processedData);
  const isAuthenticated = useDataStore(state => state.isAuthenticated);
  const setRawData = useDataStore(state => state.setRawData);
  const [isLoading, setIsLoading] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [showLoginPage, setShowLoginPage] = useState(false);

  // Load theme from localStorage on component mount, default to light
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const defaultTheme = savedTheme || 'light';
    setTheme(defaultTheme);
    document.documentElement.classList.toggle('light-mode', defaultTheme === 'light');
    // Save light as default if no theme was previously saved
    if (!savedTheme) {
      localStorage.setItem('theme', 'light');
    }
  }, []);

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('light-mode', newTheme === 'light');
  };



  // Dynamic classes based on theme
  const getThemeClass = (darkClass: string, lightClass: string) => {
    return theme === 'dark' ? darkClass : lightClass;
  };

  if (processedData) return null;

  // Show login page if requested
  if (showLoginPage) {
    return (
      <div className={`min-h-screen relative flex flex-col overflow-hidden font-sans ${getThemeClass('bg-black', 'bg-white')}`}>
        {/* Spotlight Effect - only visible in dark mode */}
        {theme === 'dark' && <Spotlight className="top-0 left-0 -translate-x-[60%] -translate-y-[10%]" fill="white" />}

        {/* Theme-specific background */}
        <div className="absolute inset-0">
          {theme === 'dark' ? (
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#fff_70%,transparent_100%)]" />
          )}
        </div>

        <header className={`relative border-b ${getThemeClass('border-white/10 bg-black/50', 'border-gray-200 bg-white/90')} backdrop-blur-xl sticky top-0 z-50 w-full`}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart2 className={getThemeClass('text-indigo-500', 'text-[#0052A5]')} />
                <span className={`font-bold text-xl ${getThemeClass('bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text', 'text-[#0052A5]')}`}>
                  Berger Paints
                </span>
              </div>
              
              {/* Theme toggle button */}
              <div className="flex items-center gap-4">
                <button 
                  onClick={toggleTheme}
                  className={`p-2 rounded-full ${getThemeClass('bg-white/10 text-white hover:bg-white/20', 'bg-gray-100 text-gray-800 hover:bg-gray-200')} transition-colors`}
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                
                <button
                  onClick={() => setShowLoginPage(false)}
                  className={`px-4 py-2 rounded-lg ${getThemeClass('text-white/70 hover:text-white hover:bg-white/10', 'text-gray-600 hover:text-[#0052A5] hover:bg-gray-100')} transition-colors`}
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center py-12">
          <Login theme={theme} getThemeClass={getThemeClass} />
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative flex flex-col overflow-hidden font-sans ${getThemeClass('bg-black', 'bg-white')}`}>
      {/* Spotlight Effect - only visible in dark mode */}
      {theme === 'dark' && <Spotlight className="top-0 left-0 -translate-x-[60%] -translate-y-[10%]" fill="white" />}

      {/* Theme-specific background */}
      <div className="absolute inset-0">
        {theme === 'dark' ? (
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#fff_70%,transparent_100%)]" />
        )}
      </div>

      <header className={`relative border-b ${getThemeClass('border-white/10 bg-black/50', 'border-gray-200 bg-white/90')} backdrop-blur-xl sticky top-0 z-50 w-full`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className={getThemeClass('text-indigo-500', 'text-[#0052A5]')} />
              <span className={`font-bold text-xl ${getThemeClass('bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text', 'text-[#0052A5]')}`}>
                Berger Paints
              </span>
            </div>
            
            {/* Theme toggle button */}
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-full ${getThemeClass('bg-white/10 text-white hover:bg-white/20', 'bg-gray-100 text-gray-800 hover:bg-gray-200')} transition-colors mr-4`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className={`text-sm font-medium ${getThemeClass('text-white/70 hover:text-white', 'text-gray-700 hover:text-[#0052A5]')} transition-colors`}>Features</a>
              <a href="#how-it-works" className={`text-sm font-medium ${getThemeClass('text-white/70 hover:text-white', 'text-gray-700 hover:text-[#0052A5]')} transition-colors`}>How It Works</a>
              <a href="#visualizations" className={`text-sm font-medium ${getThemeClass('text-white/70 hover:text-white', 'text-gray-700 hover:text-[#0052A5]')} transition-colors`}>Visualizations</a>
           
              
              <button 
                onClick={() => setShowLoginPage(true)}
                className={`${getThemeClass('bg-indigo-600 hover:bg-indigo-700 text-white', 'bg-[#0052A5] hover:bg-[#004080] text-white')} px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1`}
              >
                Get Started <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </nav>
            
            {/* Mobile Navigation Button */}
            <button 
              className={`md:hidden p-2 ${getThemeClass('text-white/70 hover:text-white', 'text-gray-700 hover:text-[#0052A5]')} focus:outline-none`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <div className="space-y-1.5">
                  <span className={`block w-6 h-0.5 ${getThemeClass('bg-white/70', 'bg-gray-700')}`}></span>
                  <span className={`block w-6 h-0.5 ${getThemeClass('bg-white/70', 'bg-gray-700')}`}></span>
                  <span className={`block w-6 h-0.5 ${getThemeClass('bg-white/70', 'bg-gray-700')}`}></span>
                </div>
              )}
            </button>
          </div>
          
          {/* Mobile Navigation Menu */}
          <div className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${isMenuOpen ? 'max-h-64 opacity-100 py-4' : 'max-h-0 opacity-0'}`}>
            <div className="flex flex-col space-y-4">
              <a href="#features" className={`text-sm font-medium ${getThemeClass('text-white/70 hover:text-white', 'text-gray-700 hover:text-[#0052A5]')} transition-colors`}>Features</a>
              <a href="#how-it-works" className={`text-sm font-medium ${getThemeClass('text-white/70 hover:text-white', 'text-gray-700 hover:text-[#0052A5]')} transition-colors`}>How It Works</a>
              <a href="#visualizations" className={`text-sm font-medium ${getThemeClass('text-white/70 hover:text-white', 'text-gray-700 hover:text-[#0052A5]')} transition-colors`}>Visualizations</a>
              <a
                href="https://github.com/yourusername/Data-analytics"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1 text-sm font-medium ${getThemeClass('text-white/70 hover:text-white', 'text-gray-700 hover:text-[#0052A5]')} transition-colors`}
              >
                GitHub <ArrowUpRight className="h-3 w-3" />
              </a>
              
              <button 
                onClick={() => setShowLoginPage(true)}
                className={`${getThemeClass('bg-indigo-600 hover:bg-indigo-700 text-white', 'bg-[#0052A5] hover:bg-[#004080] text-white')} px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 w-fit`}
              >
                Get Started <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 sm:py-28">
          <div className="container">
            <div className="relative">
              {/* Sunray beam effect - only in dark mode */}
              {theme === 'dark' && (
              <div className="absolute inset-0">
                <div className="sunray-beam" />
              </div>
              )}
              <motion.div
                initial="initial"
                animate="animate"
                variants={stagger}
                className="flex flex-col lg:flex-row justify-between items-center gap-8 relative"
              >
                {/* Text Section */}
                <motion.div variants={fadeIn} className="lg:w-1/2 space-y-6 md:space-y-8">
                  <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight ${getThemeClass('text-white', 'text-gray-900')}`}>
                    Your Go-To Solution for{' '}
                    <span className={getThemeClass('bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 text-transparent bg-clip-text', 'text-[#0052A5]')}>
                      Business Intelligence
                    </span>
                    {' '}and Data Analytics
                  </h1>
                  <p className={`text-lg ${getThemeClass('text-white/70', 'text-gray-600')}`}>
                    Aggregate Data from Diverse Sources to Deliver Actionable Insights for Business Success. 
                    Transform your data landscape with AI-powered analytics and automated processes.
                  </p>
                </motion.div>

                {/* Data GIF in Card */}
                <div className={`p-3 absolute top-30 z-10 left-1/2 transform -translate-x-1/8 rounded-2xl ${getThemeClass('bg-white/5 backdrop-blur-lg border border-white/10', 'bg-white border border-gray-100')} shadow-xl flex justify-center`}>
                    <img 
                      src={dataGif} 
                      alt="Data Analytics Process" 
                      className="w-full h-auto rounded-lg"
                      style={{ maxHeight: "350px", objectFit: "contain", maxWidth: "400px" }}
                    />
                  </div>

                {/* Get Started Section */}
                <motion.div variants={fadeIn} className="lg:w-1/3 w-full flex flex-col items-center space-y-4 lg:space-y-6">
                  {isLoading ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className={`flex flex-col items-center space-y-4 p-6 ${getThemeClass('bg-white/5 backdrop-blur-lg border border-white/10', 'bg-white border border-gray-100')} rounded-lg`}
                    >
                      <div className="relative">
                        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${getThemeClass('border-indigo-500', 'border-[#0052A5]')}`}></div>
                        <div className={`absolute inset-0 animate-pulse rounded-full h-12 w-12 border-2 ${getThemeClass('border-indigo-400 opacity-50', 'border-[#0052A5] opacity-50')}`}></div>
                      </div>
                      <p className={`${getThemeClass('text-white/80', 'text-gray-800')} text-lg font-medium text-center`}>
                        Performing ETL transformations on your data... Hang on!
                      </p>
                    </motion.div>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowLoginPage(true)}
                        className={`px-8 py-4 text-lg font-semibold text-white ${getThemeClass('bg-gradient-to-r from-indigo-500 to-purple-500', 'bg-gradient-to-r from-[#0052A5] to-[#0052A5]/80')} rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2`}
                      >
                        Get Started
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className={`py-20 relative border-t ${getThemeClass('border-white/10', 'border-gray-100')}`}>
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className={`text-3xl font-bold ${getThemeClass('text-white', 'text-gray-900')} mb-4`}>
                Our Comprehensive Data Analytics Offerings
              </h2>
              <p className={getThemeClass('text-white/70', 'text-gray-600')}>
                End-to-end solutions for modern data challenges and business intelligence needs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-6 rounded-2xl ${getThemeClass('bg-white/5 backdrop-blur-lg border border-white/10', 'bg-white border border-gray-100')}`}
                >
                  <div className={`h-12 w-12 rounded-xl ${getThemeClass('bg-indigo-500/10', 'bg-blue-50')} flex items-center justify-center mb-4`}>
                    <div className={getThemeClass('text-indigo-400', 'text-[#0052A5]')}>
                    {feature.icon}
                    </div>
                  </div>
                  <h3 className={`text-xl font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-2`}>{feature.title}</h3>
                  <p className={getThemeClass('text-white/70', 'text-gray-600')}>{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className={`py-20 relative border-t ${getThemeClass('border-white/10', 'border-gray-100')}`}>
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className={`text-3xl font-bold ${getThemeClass('text-white', 'text-gray-900')} mb-4`}>
                Explore Your Data Transformation Journey
              </h2>
              <p className={getThemeClass('text-white/70', 'text-gray-600')}>
                Vision and strategy for streamlined data operations across 5 key stages
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className={`p-6 rounded-2xl ${getThemeClass('bg-white/5 backdrop-blur-lg border border-white/10', 'bg-white border border-gray-100')}`}>
                  <div className={`text-4xl font-bold ${getThemeClass('text-indigo-400', 'text-[#0052A5]')} mb-4`}>01</div>
                  <h3 className={`text-xl font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-2`}>Vision & Strategy</h3>
                  <p className={getThemeClass('text-white/70', 'text-gray-600')}>Develop comprehensive vision and strategy for streamlined data operations and governance.</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="relative"
              >
                <div className={`p-6 rounded-2xl ${getThemeClass('bg-white/5 backdrop-blur-lg border border-white/10', 'bg-white border border-gray-100')}`}>
                  <div className={`text-4xl font-bold ${getThemeClass('text-indigo-400', 'text-[#0052A5]')} mb-4`}>02</div>
                  <h3 className={`text-xl font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-2`}>Data Landscape Assessment</h3>
                  <p className={getThemeClass('text-white/70', 'text-gray-600')}>Assess current data landscape to elevate your data strategy and identify opportunities.</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="relative"
              >
                <div className={`p-6 rounded-2xl ${getThemeClass('bg-white/5 backdrop-blur-lg border border-white/10', 'bg-white border border-gray-100')}`}>
                  <div className={`text-4xl font-bold ${getThemeClass('text-indigo-400', 'text-[#0052A5]')} mb-4`}>03</div>
                  <h3 className={`text-xl font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-2`}>Cloud Data Management</h3>
                  <p className={getThemeClass('text-white/70', 'text-gray-600')}>Modernize cloud data management through robust data governance framework.</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="relative"
              >
                <div className={`p-6 rounded-2xl ${getThemeClass('bg-white/5 backdrop-blur-lg border border-white/10', 'bg-white border border-gray-100')}`}>
                  <div className={`text-4xl font-bold ${getThemeClass('text-indigo-400', 'text-[#0052A5]')} mb-4`}>04</div>
                  <h3 className={`text-xl font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-2`}>Secure Cloud Governance</h3>
                  <p className={getThemeClass('text-white/70', 'text-gray-600')}>Secure your cloud with governance and leverage scalable technology solutions.</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="relative md:col-span-2 lg:col-span-1"
              >
                <div className={`p-6 rounded-2xl ${getThemeClass('bg-white/5 backdrop-blur-lg border border-white/10', 'bg-white border border-gray-100')}`}>
                  <div className={`text-4xl font-bold ${getThemeClass('text-indigo-400', 'text-[#0052A5]')} mb-4`}>05</div>
                  <h3 className={`text-xl font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-2`}>Data-Driven Culture</h3>
                  <p className={getThemeClass('text-white/70', 'text-gray-600')}>Future-proof your business by fostering a data-driven culture across the organization.</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className={`py-20 relative border-t ${getThemeClass('border-white/10', 'border-gray-100')}`}>
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className={`text-3xl font-bold ${getThemeClass('text-white', 'text-gray-900')} mb-4`}>
                Key Benefits of Our Data Analytics Solutions
              </h2>
              <p className={getThemeClass('text-white/70', 'text-gray-600')}>
                Turning Data Challenges into Strategic Opportunities for Business Success
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-6 rounded-2xl ${getThemeClass('bg-white/5 backdrop-blur-lg border border-white/10', 'bg-white border border-gray-100')}`}
                >
                  <CheckCircle2 className={`h-8 w-8 ${getThemeClass('text-indigo-400', 'text-[#0052A5]')} mb-4`} />
                  <h3 className={`text-xl font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-2`}>{benefit.title}</h3>
                  <p className={getThemeClass('text-white/70', 'text-gray-600')}>{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={`py-20 relative border-t ${getThemeClass('border-white/10', 'border-gray-100')} ${getThemeClass('', 'bg-gradient-to-b from-white to-blue-50')}`}>
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className={`text-3xl font-bold ${getThemeClass('text-white', 'text-[#0052A5]')} mb-4`}>
                Discover How We Can Help You Succeed!
              </h2>
              <p className={`text-lg ${getThemeClass('text-white/70', 'text-gray-600')} mb-8`}>
                Are you ready to harness the power of data analytics and AI? Contact us today to explore customized solutions tailored to your unique challenges.
              </p>
              <div className="flex flex-col items-center space-y-6">
                {isLoading ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`flex flex-col items-center space-y-4 p-6 ${getThemeClass('bg-white/5 backdrop-blur-lg border border-white/10', 'bg-white/80 border border-[#0052A5]/20')} rounded-lg`}
                  >
                    <div className="relative">
                      <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${getThemeClass('border-indigo-500', 'border-[#0052A5]')}`}></div>
                      <div className={`absolute inset-0 animate-pulse rounded-full h-12 w-12 border-2 ${getThemeClass('border-indigo-400 opacity-50', 'border-[#0052A5] opacity-50')}`}></div>
                    </div>
                    <p className={`${getThemeClass('text-white/80', 'text-gray-800')} text-lg font-medium`}>
                      Performing ETL transformations on your data... Hang on!
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <button
                      onClick={() => setShowLoginPage(true)}
                      className={`px-8 py-4 text-lg font-semibold text-white ${getThemeClass('bg-gradient-to-r from-indigo-500 to-purple-500', 'bg-gradient-to-r from-[#0052A5] to-[#0052A5]/80')} rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2`}
                    >
                      Get Started
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={`relative border-t ${getThemeClass('border-white/10 py-12 bg-black/50', 'border-gray-200 py-12 bg-white')} backdrop-blur-xl`}>
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className={getThemeClass('text-indigo-500', 'text-[#0052A5]')} />
                <span className={`font-bold text-xl ${getThemeClass('bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text', 'text-[#0052A5]')}`}>
                  Berger Paints
                </span>
              </div>
              <p className={`text-sm ${getThemeClass('text-white/50', 'text-gray-500')}`}>
                Your go-to solution for business intelligence and data analytics. Aggregate data from diverse sources to deliver actionable insights.
              </p>
            </div>
            
            <div>
              <h4 className={`font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-4`}>Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className={`${getThemeClass('text-white/70 hover:text-white', 'text-gray-700 hover:text-[#0052A5]')} transition-colors`}>Features</a></li>
                <li><a href="#how-it-works" className={`${getThemeClass('text-white/70 hover:text-white', 'text-gray-700 hover:text-[#0052A5]')} transition-colors`}>How It Works</a></li>
                <li><a href="#visualizations" className={`${getThemeClass('text-white/70 hover:text-white', 'text-gray-700 hover:text-[#0052A5]')} transition-colors`}>Visualizations</a></li>
              </ul>
            </div>

            <div>
              <h4 className={`font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-4`}>Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className={`${getThemeClass('text-white/70 hover:text-white', 'text-gray-700 hover:text-[#0052A5]')} transition-colors`}>Documentation</a></li>
                <li><a href="#" className={`${getThemeClass('text-white/70 hover:text-white', 'text-gray-700 hover:text-[#0052A5]')} transition-colors`}>API Reference</a></li>
                <li><a href="#" className={`${getThemeClass('text-white/70 hover:text-white', 'text-gray-700 hover:text-[#0052A5]')} transition-colors`}>Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className={`font-semibold ${getThemeClass('text-white', 'text-gray-900')} mb-4`}>Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className={`${getThemeClass('text-white/70 hover:text-white', 'text-gray-700 hover:text-[#0052A5]')} transition-colors`}>Privacy Policy</a></li>
                <li><a href="#" className={`${getThemeClass('text-white/70 hover:text-white', 'text-gray-700 hover:text-[#0052A5]')} transition-colors`}>Terms of Service</a></li>
                <li><a href="#" className={`${getThemeClass('text-white/70 hover:text-white', 'text-gray-700 hover:text-[#0052A5]')} transition-colors`}>Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className={`mt-12 pt-8 border-t ${getThemeClass('border-white/10', 'border-gray-100')}`}>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className={`text-sm ${getThemeClass('text-white/50', 'text-gray-500')}`}>
                © 2024 Berger Paints. All rights reserved.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className={`${getThemeClass('text-white/50 hover:text-white', 'text-gray-500 hover:text-[#0052A5]')} transition-colors`}>
                  <ArrowUpRight className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Add CSS for light mode */}
      <style>{`
        :root {
          --primary-color: #0052A5;
          --secondary-color: #E63946;
          --background-color: #FFFFFF;
          --card-bg: #F8F9FA;
          --text-color: #333333;
          --text-secondary: #666666;
          --border-color: #E5E7EB;
          --berger-font: 'Geist-Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
        }
        
        .light-mode {
          color-scheme: light;
        }

        .light-mode body,
        .light-mode .bg-black {
          background-color: var(--background-color);
          color: var(--text-color);
        }

        .light-mode h1, 
        .light-mode h2, 
        .light-mode h3, 
        .light-mode h4, 
        .light-mode h5, 
        .light-mode h6 {
          color: var(--text-color);
        }

        .light-mode a {
          color: var(--primary-color);
        }
      `}</style>

    </div>
  );
};