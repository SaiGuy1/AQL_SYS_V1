
import React from 'react';
import { Link } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import { Button } from '@/components/ui/button';
import { Clipboard, BarChart3, Clock, AlertTriangle, Users } from 'lucide-react';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <NavBar />
      
      <main className="flex-grow">
        <section className="bg-gradient-to-b from-blue-600 to-blue-700 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Automotive Quality & Logistics Inspection System
            </h1>
            <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto opacity-90">
              Streamline job creation, defect reporting, and timesheet management for superior quality control
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/aql">
                <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
                  Get Started
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-blue-600">
                  View Analytics
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center text-center">
                <div className="bg-blue-100 p-3 rounded-full mb-4">
                  <Clipboard className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Job Management</h3>
                <p className="text-slate-600">Create, assign and track inspection jobs with customizable workflows</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center text-center">
                <div className="bg-blue-100 p-3 rounded-full mb-4">
                  <AlertTriangle className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Defect Reporting</h3>
                <p className="text-slate-600">Document defects with photos, track remediation, and maintain clear evidence</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center text-center">
                <div className="bg-blue-100 p-3 rounded-full mb-4">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Time Tracking</h3>
                <p className="text-slate-600">Accurate time tracking with approval workflows and automated billing</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center text-center">
                <div className="bg-blue-100 p-3 rounded-full mb-4">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Advanced Analytics</h3>
                <p className="text-slate-600">Real-time dashboards and customizable reports for data-driven decisions</p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-20 bg-slate-100">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                <div className="absolute left-5 md:left-8 top-0 h-full w-1 bg-blue-200 rounded"></div>
                
                <div className="relative z-10 mb-12">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-bold">1</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                      <h3 className="text-xl font-semibold mb-2">Create Inspection Jobs</h3>
                      <p className="text-slate-600">Managers create inspection jobs with detailed requirements, guidelines, and safety information.</p>
                    </div>
                  </div>
                </div>
                
                <div className="relative z-10 mb-12">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-bold">2</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                      <h3 className="text-xl font-semibold mb-2">Complete Certification</h3>
                      <p className="text-slate-600">Inspectors complete required safety and quality control certifications before starting work.</p>
                    </div>
                  </div>
                </div>
                
                <div className="relative z-10 mb-12">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-bold">3</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                      <h3 className="text-xl font-semibold mb-2">Perform Inspections</h3>
                      <p className="text-slate-600">Inspectors execute quality checks and report defects with detailed documentation and photos.</p>
                    </div>
                  </div>
                </div>
                
                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-bold">4</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm">
                      <h3 className="text-xl font-semibold mb-2">Review Analytics</h3>
                      <p className="text-slate-600">Managers and customers review real-time reports on quality metrics, defect rates, and performance.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-20 bg-blue-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-8">Ready to Streamline Your Quality Management?</h2>
            <p className="text-xl mb-10 max-w-3xl mx-auto opacity-90">
              Improve productivity, reduce errors, and gain better visibility into your automotive quality processes.
            </p>
            <Link to="/aql">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
                Get Started Now
              </Button>
            </Link>
          </div>
        </section>
      </main>
      
      <footer className="bg-slate-900 text-slate-300 py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">AQL Inspector</h3>
              <p className="text-sm">Automotive Quality & Logistics Inspection System for superior quality control.</p>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-4">Features</h4>
              <ul className="space-y-2 text-sm">
                <li>Job Management</li>
                <li>Quality Inspection</li>
                <li>Defect Reporting</li>
                <li>Time Tracking</li>
                <li>Analytics</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li>Documentation</li>
                <li>API Reference</li>
                <li>Support Center</li>
                <li>Mobile App</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>About Us</li>
                <li>Contact</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-10 pt-6 text-center text-sm">
            <p>&copy; 2024 AQL Inspector. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
