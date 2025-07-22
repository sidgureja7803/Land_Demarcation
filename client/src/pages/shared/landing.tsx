import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, History, AlertTriangle, Gauge, Clock, Users, ChartLine, Search, Menu, X, Languages } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/login";
  };
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Gov top strip */}
      <div className="govt-top-strip w-full"></div>
      
      {/* Accessibility Bar */}
      <div className="bg-gray-100 py-1 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6 text-xs">
              <div className="font-size-control flex items-center">
                <span className="mr-2 text-gray-600">Font Size:</span>
                <a className="text-xs">A-</a>
                <a className="text-base">A</a>
                <a className="text-lg">A+</a>
              </div>
              <a href="#" className="text-gray-600 flex items-center"><Languages className="h-3 w-3 mr-1" /> हिंदी</a>
            </div>
            <div className="flex items-center space-x-4 text-xs">
              <div className="govt-badge">Official Website</div>
              <a href="#" className="text-gray-600">Site Map</a>
              <a href="#" className="text-gray-600">Contact</a>
            </div>
          </div>
        </div>
      </div>
      
      {/* Government Header */}
      <header className="govt-header py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Emblem of India" className="h-16" />
                <div className="border-l border-gray-300 pl-4">
                  <div>
                    <h1 className="text-xl font-bold text-navy">Land Demarcation Tracker</h1>
                    <p className="text-sm font-semibold text-gray-600">ADC Office, Mahendragarh</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Government of Haryana, India</p>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search" 
                  className="py-1 px-3 pr-8 border border-gray-300 rounded text-sm w-44 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                />
                <Search className="h-4 w-4 text-gray-400 absolute right-2 top-2" />
              </div>
              <Button onClick={handleLogin} className="bg-navy hover:bg-blue-900 text-white">
                Login
              </Button>
            </div>
            <button 
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-lg">
          <div className="px-4 py-3 space-y-3">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search" 
                className="py-2 px-3 pr-8 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500" 
              />
              <Search className="h-4 w-4 text-gray-400 absolute right-3 top-3" />
            </div>
            <Button onClick={handleLogin} className="w-full bg-navy hover:bg-blue-900 text-white">
              Login
            </Button>
            <div className="pt-2 border-t border-gray-200">
              <a href="#" className="block py-2 text-gray-600">Site Map</a>
              <a href="#" className="block py-2 text-gray-600">Contact</a>
              <a href="#" className="block py-2 text-gray-600">हिंदी</a>
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation Bar */}
      <nav className="govt-nav shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto">
            <Link href="/">
              <a className="py-3 px-4 text-sm font-medium whitespace-nowrap hover:bg-white/10">Home</a>
            </Link>
            <Link href="/about">
              <a className="py-3 px-4 text-sm font-medium whitespace-nowrap hover:bg-white/10">About Us</a>
            </Link>
            <Link href="/services">
              <a className="py-3 px-4 text-sm font-medium whitespace-nowrap hover:bg-white/10">Services</a>
            </Link>
            <Link href="/schemes">
              <a className="py-3 px-4 text-sm font-medium whitespace-nowrap hover:bg-white/10">Schemes</a>
            </Link>
            <Link href="/regulations">
              <a className="py-3 px-4 text-sm font-medium whitespace-nowrap hover:bg-white/10">Land Regulations</a>
            </Link>
            <Link href="/plots">
              <a className="py-3 px-4 text-sm font-medium whitespace-nowrap hover:bg-white/10">Plot Records</a>
            </Link>
            <Link href="/contact">
              <a className="py-3 px-4 text-sm font-medium whitespace-nowrap hover:bg-white/10">Contact Us</a>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Banner */}
      <section className="relative py-4 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto py-2 space-x-4 whitespace-nowrap text-xs text-gray-600">
            <span className="flex items-center font-medium">Important Links:</span>
            <a href="#" className="hover:underline">Right to Information</a>
            <a href="#" className="hover:underline">Public Grievances</a>
            <a href="#" className="hover:underline">e-Services</a>
            <a href="#" className="hover:underline">Forms & Downloads</a>
            <a href="#" className="hover:underline">Payment Portal</a>
            <a href="#" className="hover:underline">e-Gazette</a>
          </div>
        </div>
      </section>
      
      {/* Hero Section with Tricolor Accents */}
      <section className="haryana-hero text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tricolor strip at top of hero */}
          <div className="flex mb-8">
            <div className="h-1 bg-saffron w-1/3"></div>
            <div className="h-1 bg-white w-1/3"></div>
            <div className="h-1 bg-green w-1/3"></div>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                Digital Land Demarcation Management System
              </h2>
              <p className="text-lg mb-8 text-blue-100">
                An integrated platform for citizens and revenue officers to track and manage land demarcation activities in Mahendragarh district, Haryana.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleLogin}
                  className="bg-white text-navy hover:bg-gray-100"
                >
                  Citizen Login
                </Button>
                <Button 
                  onClick={handleLogin}
                  className="bg-saffron hover:bg-orange-600 text-white border-0"
                >
                  Officer Login
                </Button>
              </div>
              <div className="mt-6 flex items-center text-sm">
                <span className="bg-white/20 px-3 py-1 rounded-full flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>Last Updated: July 22, 2025</span>
                </span>
              </div>
            </div>
            <div className="relative">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24">
                  <div className="absolute -right-12 -top-12 w-24 h-24 bg-saffron transform rotate-45"></div>
                </div>
                
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold mb-2">Land Records Dashboard</h3>
                    <p className="text-sm text-blue-100">Real-time demarcation statistics</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-navy/30 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold">234</div>
                      <div className="text-xs text-blue-200">Active Plots</div>
                    </div>
                    <div className="bg-saffron/30 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold">12</div>
                      <div className="text-xs text-blue-200">Pending Cases</div>
                    </div>
                    <div className="bg-green/30 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold">89%</div>
                      <div className="text-xs text-blue-200">Resolution Rate</div>
                    </div>
                  </div>
                  
                  <div className="text-center text-blue-200 border-t border-white/20 pt-4">
                    <ChartLine className="mx-auto text-3xl mb-2" />
                    <p className="text-xs">Integrated with Digital India Land Records</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Tricolor strip at bottom of hero */}
          <div className="flex mt-8">
            <div className="h-1 bg-saffron w-1/3"></div>
            <div className="h-1 bg-white w-1/3"></div>
            <div className="h-1 bg-green w-1/3"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block border-b-2 border-saffron pb-1 mb-2">
              <h3 className="text-2xl font-bold text-navy">
                Land Demarcation Services
              </h3>
            </div>
            <p className="text-base text-gray-600 max-w-3xl mx-auto">
              Comprehensive digital platform for citizens and revenue officers to efficiently track, manage, and resolve land demarcation activities.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="text-navy text-xl" />
              </div>
              <h4 className="text-lg font-semibold mb-3 text-center">Plot Tracking</h4>
              <p className="text-sm text-gray-600">
                Log and monitor demarcation activities for each plot with detailed timestamps and officer assignments.
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-saffron/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="text-saffron text-xl" />
              </div>
              <h4 className="text-lg font-semibold mb-3 text-center">Historical Records</h4>
              <p className="text-sm text-gray-600">
                Maintain comprehensive ledger of all historical and current demarcation activities for complete audit trails.
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="text-green text-xl" />
              </div>
              <h4 className="text-lg font-semibold mb-3 text-center">Duplicate Detection</h4>
              <p className="text-sm text-gray-600">
                Automatically identify and flag duplicate entries to prevent conflicts and streamline resolution processes.
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gauge className="text-navy text-xl" />
              </div>
              <h4 className="text-lg font-semibold mb-3 text-center">Administrative Dashboard</h4>
              <p className="text-sm text-gray-600">
                District and circle-level dashboards provide real-time visibility into officer activities and case statuses.
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-saffron/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="text-saffron text-xl" />
              </div>
              <h4 className="text-lg font-semibold mb-3 text-center">Pendency Tracking</h4>
              <p className="text-sm text-gray-600">
                Monitor file pendency and case resolution timelines to ensure timely completion of demarcation activities.
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-green text-xl" />
              </div>
              <h4 className="text-lg font-semibold mb-3 text-center">Multi-level Access</h4>
              <p className="text-sm text-gray-600">
                Role-based access control for citizens, officers, supervisors, and administrators with appropriate permissions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Notice Section */}
      <section className="py-8 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex-shrink-0 mb-4 md:mb-0">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-navy rounded-full flex items-center justify-center mr-3">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-navy">Public Notice</h4>
              </div>
            </div>
            <div className="flex-grow md:ml-6">
              <p className="text-sm text-gray-600">
                All citizens are hereby informed that land demarcation applications can be submitted online through this portal. Physical visits to the ADC office are required only for document verification. For any assistance, please contact the helpdesk at <span className="text-navy font-medium">helpdesk-adc-mahendragarh@gov.in</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="govt-footer py-8 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1">
              <div className="flex items-center mb-4">
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Emblem of India" className="h-10 mr-3" />
                <div>
                  <h5 className="text-white font-bold">ADC Office</h5>
                  <p className="text-xs text-blue-200">Mahendragarh, Haryana</p>
                </div>
              </div>
              <p className="text-xs text-blue-200">
                Government of Haryana<br />
                Additional Deputy Commissioner Office<br />
                Mahendragarh District, Haryana<br />
                PIN: 123029
              </p>
            </div>
            
            <div className="col-span-1">
              <h5 className="font-semibold text-white mb-4">Important Links</h5>
              <ul className="space-y-2 text-xs">
                <li><a href="#" className="text-blue-200 hover:text-white">About Us</a></li>
                <li><a href="#" className="text-blue-200 hover:text-white">Citizen Services</a></li>
                <li><a href="#" className="text-blue-200 hover:text-white">Officer Portal</a></li>
                <li><a href="#" className="text-blue-200 hover:text-white">Land Records</a></li>
                <li><a href="#" className="text-blue-200 hover:text-white">Contact Us</a></li>
              </ul>
            </div>
            
            <div className="col-span-1">
              <h5 className="font-semibold text-white mb-4">Policies</h5>
              <ul className="space-y-2 text-xs">
                <li><a href="#" className="text-blue-200 hover:text-white">Terms of Use</a></li>
                <li><a href="#" className="text-blue-200 hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="text-blue-200 hover:text-white">Copyright Policy</a></li>
                <li><a href="#" className="text-blue-200 hover:text-white">Accessibility Statement</a></li>
                <li><a href="#" className="text-blue-200 hover:text-white">Hyperlinking Policy</a></li>
              </ul>
            </div>
            
            <div className="col-span-1">
              <h5 className="font-semibold text-white mb-4">Contact Information</h5>
              <ul className="space-y-2 text-xs">
                <li className="text-blue-200">Phone: +91 1234-567890</li>
                <li className="text-blue-200">Email: adc-mahendragarh@gov.in</li>
                <li className="text-blue-200">Helpdesk: 1800-123-4567</li>
              </ul>
              <div className="mt-4">
                <div className="flex items-center">
                  <div className="bg-white/10 px-3 py-1 rounded-full text-xs text-blue-200">
                    Last Updated: July 22, 2025
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-6">
            <div className="flex flex-col-reverse md:flex-row justify-between items-center">
              <p className="text-xs text-blue-200 mt-4 md:mt-0">
                © {new Date().getFullYear()} Additional Deputy Commissioner Office, Mahendragarh | Government of Haryana
              </p>
              <div className="flex space-x-2">
                <div className="h-1 w-8 bg-saffron"></div>
                <div className="h-1 w-8 bg-white"></div>
                <div className="h-1 w-8 bg-green"></div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
