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
  ArrowUpRight
} from 'lucide-react';
import { FileUpload } from './FileUpload';
import { useDataStore } from '../store/dataStore';
import { Spotlight } from './Spotlight';
import { motion } from 'framer-motion';

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
    icon: <Upload className="h-5 w-5 text-indigo-400" />,
    title: "Easy CSV Upload",
    description: "Simply drag & drop your CSV files or click to upload. We handle the parsing and processing automatically."
  },
  {
    icon: <BarChart className="h-5 w-5 text-indigo-400" />,
    title: "Instant Visualizations",
    description: "Get beautiful, interactive charts and graphs instantly. No coding or configuration required."
  },
  {
    icon: <Brain className="h-5 w-5 text-indigo-400" />,
    title: "AI-Powered Analysis",
    description: "Our AI analyzes your data to provide meaningful insights and explanations for each visualization."
  },
  {
    icon: <Table className="h-5 w-5 text-indigo-400" />,
    title: "Data Summary",
    description: "Get quick statistics and overview of your dataset including row counts, column types, and data quality."
  },
  {
    icon: <MessageSquare className="h-5 w-5 text-indigo-400" />,
    title: "Interactive Chat",
    description: "Ask questions about your data in natural language and get instant answers powered by AI."
  },
  {
    icon: <Zap className="h-5 w-5 text-indigo-400" />,
    title: "Real-time Processing",
    description: "Process large datasets quickly with our optimized algorithms and streaming capabilities."
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
    title: "Save Time",
    description: "Transform raw CSV data into meaningful visualizations in seconds, not hours"
  },
  {
    title: "Make Better Decisions",
    description: "Get AI-powered insights to guide your decision-making process"
  },
  {
    title: "No Technical Skills Required",
    description: "User-friendly interface that anyone can use, regardless of technical background"
  }
];

export const LandingPage: React.FC = () => {
  const processedData = useDataStore(state => state.processedData);
  const [isLoading, setIsLoading] = useState(false);

  if (processedData) return null;

  return (
    <div className="min-h-screen bg-black relative flex flex-col overflow-hidden">
      {/* Spotlight Effect */}
      <Spotlight />

      {/* Modern gradient background with beam effect */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <header className="relative border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-indigo-500" />
            <span className="font-bold text-xl bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text">
              DataAnalytics
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-white/70 hover:text-white transition-colors">How It Works</a>
            <a href="#visualizations" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Visualizations</a>
            <a
              href="https://github.com/yourusername/Data-analytics"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-white/70 hover:text-white transition-colors"
            >
              GitHub
            </a>
          </nav>
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
                    Transform Your CSV Data into{' '}
                    <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
                      Powerful Insights
                    </span>
                  </h1>
                  <p className="text-lg sm:text-xl text-white/70">
                    Upload your CSV data and instantly get AI-powered analytics,
                    beautiful visualizations, and deep insights. No coding required.
                  </p>
                </motion.div>
                {/* Right Side: Upload Component with enhanced styling */}
                <motion.div variants={fadeIn} className="lg:w-1/2 flex justify-center">
                  {isLoading ? (
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
                        Performing ETL transformations on your data... Hang on!
                      </p>
                    </motion.div>
                  ) : (
                    <FileUpload
                      className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                      onUploadStart={() => setIsLoading(true)}
                      onUploadComplete={() => setIsLoading(false)}
                    />
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
                Everything You Need to Analyze Your Data
              </h2>
              <p className="text-white/70">
                Powerful features that make data analysis accessible to everyone
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
                How It Works
              </h2>
              <p className="text-white/70">
                Get from raw CSV to insights in three simple steps
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10">
                  <div className="text-4xl font-bold text-indigo-400 mb-4">01</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Upload Your CSV</h3>
                  <p className="text-white/70">Drag and drop your CSV file or click to upload. We'll handle the parsing automatically.</p>
                </div>
                <ArrowRight className="hidden md:block absolute -right-8 top-1/2 -translate-y-1/2 text-indigo-400" />
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
                  <h3 className="text-xl font-semibold text-white mb-2">Instant Analysis</h3>
                  <p className="text-white/70">Our system automatically generates visualizations and analyzes your data patterns.</p>
                </div>
                <ArrowRight className="hidden md:block absolute -right-8 top-1/2 -translate-y-1/2 text-indigo-400" />
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
                  <h3 className="text-xl font-semibold text-white mb-2">Get Insights</h3>
                  <p className="text-white/70">Explore interactive visualizations and get AI-powered explanations for your data.</p>
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
                Why Choose DataAnalytics
              </h2>
              <p className="text-white/70">
                The fastest way to get meaningful insights from your CSV data
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                Ready to Transform Your Data?
              </h2>
              <p className="text-lg text-white/70 mb-8">
                Upload your CSV file now and get instant insights with our AI-powered analytics platform.
              </p>
              {isLoading ? (
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
                    Performing ETL transformations on your data... Hang on!
                  </p>
                </motion.div>
              ) : (
                <FileUpload
                  className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                  onUploadStart={() => setIsLoading(true)}
                  onUploadComplete={() => setIsLoading(false)}
                />
              )}
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
                  DataAnalytics
                </span>
              </div>
              <p className="text-sm text-white/50">
                Transform your CSV data into actionable insights with AI-powered analytics.
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
                © 2024 DataAnalytics. All rights reserved.
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