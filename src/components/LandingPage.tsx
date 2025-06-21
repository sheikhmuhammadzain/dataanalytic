"use client";
import React, { useState } from 'react';
import '../styles/sunray.css'
import { 
  FileText, 
  BarChart2, 
  ArrowRight, 
  LineChart, 
  PieChart, 
  Sparkles,
  Brain,
  Zap,
  Upload,
  BarChart,
  Table,
  MessageSquare,
  CheckCircle2,
  ArrowUpRight,
  X
} from 'lucide-react';
import { FileUpload } from './FileUpload';
import { useDataStore } from '../store/dataStore';
import { Spotlight } from './Spotlight';
import { motion } from 'framer-motion';
import { generateSyntheticPaintsData } from '../services/gemini';

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
    icon: <BarChart2 className="h-5 w-5 text-indigo-400" />,
    title: "Data Engineering & Migration",
    description: "Data pipeline development, data integration, and ETL. Seamless cloud migration services for digital transformation."
  },
  {
    icon: <Brain className="h-5 w-5 text-indigo-400" />,
    title: "Advanced Analytics & BI",
    description: "Comprehensive BI solutions for data visualization and reporting. Real-time analytics and inference for dynamic decision-making."
  },
  {
    icon: <Zap className="h-5 w-5 text-indigo-400" />,
    title: "AI & Machine Learning",
    description: "AI/ML model development including Generative AI, predictive analytics, and time series forecasting solutions."
  },
  {
    icon: <Upload className="h-5 w-5 text-indigo-400" />,
    title: "Cloud-based Solutions",
    description: "Scalable cloud-based data platforms and analytics tools with end-to-end support for digital transformation."
  },
  {
    icon: <MessageSquare className="h-5 w-5 text-indigo-400" />,
    title: "NLP & Virtual Assistants",
    description: "Natural Language Processing solutions including virtual assistants and conversational AI for enhanced user experiences."
  },
  {
    icon: <Table className="h-5 w-5 text-indigo-400" />,
    title: "Support & Maintenance",
    description: "24/7 monitoring, troubleshooting, and engineering support with advanced model optimization and tuning."
  }
];

const visualizations = [
  {
    icon: <BarChart2 className="h-5 w-5 text-indigo-400" />,
    title: "Distribution Analysis",
    description: "Understand the spread and patterns in your numerical data"
  },
  {
    icon: <LineChart className="h-5 w-5 text-indigo-400" />,
    title: "Time Series Analysis",
    description: "Track trends and patterns over time"
  },
  {
    icon: <PieChart className="h-5 w-5 text-indigo-400" />,
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
  const setRawData = useDataStore(state => state.setRawData);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleGenerateSyntheticData = async () => {
    setIsGenerating(true);
    try {
      const syntheticData = await generateSyntheticPaintsData();
      setRawData(syntheticData);
    } catch (error) {
      console.error('Failed to generate synthetic data:', error);
      // You could add a toast notification here
    } finally {
      setIsGenerating(false);
    }
  };

  if (processedData) return null;

  return (
    <div className="min-h-screen bg-black relative flex flex-col overflow-hidden font-sans">
      {/* Spotlight Effect */}
      <Spotlight className="top-0 left-0 -translate-x-[60%] -translate-y-[10%]" fill="white" />

      {/* Modern gradient background with beam effect */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <header className="relative border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-6 w-6 text-indigo-500" />
              <span className="font-bold text-xl bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text">
                BusinessIntel
              </span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm font-medium text-white/70 hover:text-white transition-colors">How It Works</a>
              <a href="#visualizations" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Visualizations</a>
              <a
                href="https://github.com/yourusername/Data-analytics"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm font-medium text-white/70 hover:text-white transition-colors"
              >
                GitHub <ArrowUpRight className="h-3 w-3" />
              </a>
              
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1">
                Get Started <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </nav>
            
            {/* Mobile Navigation Button */}
            <button 
              className="md:hidden p-2 text-white/70 hover:text-white focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <div className="space-y-1.5">
                  <span className="block w-6 h-0.5 bg-white/70"></span>
                  <span className="block w-6 h-0.5 bg-white/70"></span>
                  <span className="block w-6 h-0.5 bg-white/70"></span>
                </div>
              )}
            </button>
          </div>
          
          {/* Mobile Navigation Menu */}
          <div className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${isMenuOpen ? 'max-h-64 opacity-100 py-4' : 'max-h-0 opacity-0'}`}>
            <div className="flex flex-col space-y-4">
              <a href="#features" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm font-medium text-white/70 hover:text-white transition-colors">How It Works</a>
              <a href="#visualizations" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Visualizations</a>
              <a
                href="https://github.com/yourusername/Data-analytics"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm font-medium text-white/70 hover:text-white transition-colors"
              >
                GitHub <ArrowUpRight className="h-3 w-3" />
              </a>
              
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 w-fit">
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
              {/* Sunray beam effect */}
              <div className="absolute inset-0">
                <div className="sunray-beam" />
              </div>
              <motion.div
                initial="initial"
                animate="animate"
                variants={stagger}
                className="flex flex-col lg:flex-row items-center justify-between gap-12"
              >
                {/* Left Side: Text */}
                <motion.div variants={fadeIn} className="lg:w-1/2 space-y-8">
                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white">
                    Your Go-To Solution for{' '}
                    <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
                      Business Intelligence
                    </span>
                    {' '}and Data Analytics
                  </h1>
                  <p className="text-lg sm:text-xl text-white/70">
                    Aggregate Data from Diverse Sources to Deliver Actionable Insights for Business Success. 
                    Transform your data landscape with AI-powered analytics and automated processes.
                  </p>
                </motion.div>
                {/* Right Side: Upload Component with enhanced styling */}
                <motion.div variants={fadeIn} className="lg:w-1/2 flex flex-col items-center space-y-6">
                  {isLoading || isGenerating ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col items-center space-y-4 p-6 bg-white/5 backdrop-blur-lg rounded-lg border border-white/10"
                    >
                      <div className="relative">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                        <div className="absolute inset-0 animate-pulse rounded-full h-12 w-12 border-2 border-indigo-400 opacity-50"></div>
                      </div>
                      <p className="text-white/80 text-lg font-medium text-center">
                        {isGenerating 
                          ? "Generating synthetic paints company data..." 
                          : "Performing ETL transformations on your data... Hang on!"
                        }
                      </p>
                    </motion.div>
                  ) : (
                    <>
                      <FileUpload
                        className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                        onUploadStart={() => setIsLoading(true)}
                        onUploadComplete={() => setIsLoading(false)}
                      />
                      
                      <div className="flex items-center space-x-4 text-white/50">
                        <div className="h-px bg-white/20 flex-1"></div>
                        <span className="text-sm font-medium">OR</span>
                        <div className="h-px bg-white/20 flex-1"></div>
                      </div>
                      
                      <div className="relative group">
                        <button
                          onClick={handleGenerateSyntheticData}
                          disabled={isGenerating}
                          className="relative inline-block p-px font-semibold leading-6 text-white bg-gray-800 shadow-2xl cursor-pointer rounded-xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-400 via-blue-500 to-purple-500 p-[2px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"></span>
                          
                          <span className="relative z-10 block px-6 py-3 rounded-xl bg-gray-950">
                            <div className="relative z-10 flex items-center space-x-2">
                              <Sparkles className="w-5 h-5 transition-transform duration-500 group-hover:translate-x-1" />
                              <span className="transition-all duration-500 group-hover:translate-x-1">
                                Generate Synthetic Data
                              </span>
                              <ArrowRight className="w-5 h-5 transition-transform duration-500 group-hover:translate-x-1" />
                            </div>
                          </span>
                        </button>
                      </div>
                      
                      <p className="text-sm text-white/50 text-center max-w-sm">
                        Try our demo with AI-generated paints company data to explore all features
                      </p>
                    </>
                  )}
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 relative border-t border-white/10">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">
                Our Comprehensive Data Analytics Offerings
              </h2>
              <p className="text-white/70">
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
                  className="p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10"
                >
                  <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/70">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 relative border-t border-white/10">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">
                Explore Your Data Transformation Journey
              </h2>
              <p className="text-white/70">
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
                <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10">
                  <div className="text-4xl font-bold text-indigo-400 mb-4">01</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Vision & Strategy</h3>
                  <p className="text-white/70">Develop comprehensive vision and strategy for streamlined data operations and governance.</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="relative"
              >
                <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10">
                  <div className="text-4xl font-bold text-indigo-400 mb-4">02</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Data Landscape Assessment</h3>
                  <p className="text-white/70">Assess current data landscape to elevate your data strategy and identify opportunities.</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="relative"
              >
                <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10">
                  <div className="text-4xl font-bold text-indigo-400 mb-4">03</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Cloud Data Management</h3>
                  <p className="text-white/70">Modernize cloud data management through robust data governance framework.</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="relative"
              >
                <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10">
                  <div className="text-4xl font-bold text-indigo-400 mb-4">04</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Secure Cloud Governance</h3>
                  <p className="text-white/70">Secure your cloud with governance and leverage scalable technology solutions.</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="relative md:col-span-2 lg:col-span-1"
              >
                <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10">
                  <div className="text-4xl font-bold text-indigo-400 mb-4">05</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Data-Driven Culture</h3>
                  <p className="text-white/70">Future-proof your business by fostering a data-driven culture across the organization.</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 relative border-t border-white/10">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">
                Key Benefits of Our Data Analytics Solutions
              </h2>
              <p className="text-white/70">
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
                  className="p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10"
                >
                  <CheckCircle2 className="h-8 w-8 text-indigo-400 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">{benefit.title}</h3>
                  <p className="text-white/70">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 relative border-t border-white/10">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                Discover How We Can Help You Succeed!
              </h2>
              <p className="text-lg text-white/70 mb-8">
                Are you ready to harness the power of data analytics and AI? Contact us today to explore customized solutions tailored to your unique challenges.
              </p>
              <div className="flex flex-col items-center space-y-6">
                {isLoading || isGenerating ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center space-y-4 p-6 bg-white/5 backdrop-blur-lg rounded-lg border border-white/10"
                  >
                    <div className="relative">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                      <div className="absolute inset-0 animate-pulse rounded-full h-12 w-12 border-2 border-indigo-400 opacity-50"></div>
                    </div>
                    <p className="text-white/80 text-lg font-medium">
                      {isGenerating 
                        ? "Generating synthetic paints company data..." 
                        : "Performing ETL transformations on your data... Hang on!"
                      }
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <FileUpload
                      className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                      onUploadStart={() => setIsLoading(true)}
                      onUploadComplete={() => setIsLoading(false)}
                    />
                    
                    <div className="flex items-center space-x-4 text-white/50">
                      <div className="h-px bg-white/20 flex-1 max-w-20"></div>
                      <span className="text-sm font-medium">OR</span>
                      <div className="h-px bg-white/20 flex-1 max-w-20"></div>
                    </div>
                    
                    <div className="relative group">
                      <button
                        onClick={handleGenerateSyntheticData}
                        disabled={isGenerating}
                        className="relative inline-block p-px font-semibold leading-6 text-white bg-gray-800 shadow-2xl cursor-pointer rounded-xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-400 via-blue-500 to-purple-500 p-[2px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"></span>
                        
                        <span className="relative z-10 block px-6 py-3 rounded-xl bg-gray-950">
                          <div className="relative z-10 flex items-center space-x-2">
                            <Sparkles className="w-5 h-5 transition-transform duration-500 group-hover:translate-x-1" />
                            <span className="transition-all duration-500 group-hover:translate-x-1">
                              Generate Synthetic Data
                            </span>
                            <ArrowRight className="w-5 h-5 transition-transform duration-500 group-hover:translate-x-1" />
                          </div>
                        </span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-white/10 py-12 bg-black/50 backdrop-blur-xl">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="h-6 w-6 text-indigo-500" />
                <span className="font-bold text-xl bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text">
                  BusinessIntel
                </span>
              </div>
              <p className="text-sm text-white/50">
                Your go-to solution for business intelligence and data analytics. Aggregate data from diverse sources to deliver actionable insights.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#visualizations" className="hover:text-white transition-colors">Visualizations</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-white/50">
                © 2024 BusinessIntel. All rights reserved.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="text-white/50 hover:text-white transition-colors">
                  <ArrowUpRight className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};