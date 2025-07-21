import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, ClipboardList, History, AlertTriangle, Gauge, Clock, Users, ChartLine } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <MapPin className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-neutral-800">Land Demarcation Tracker</h1>
                <p className="text-sm text-neutral-500">ADC Mahendragarh</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={handleLogin} className="bg-primary hover:bg-blue-700 text-white">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="gradient-hero text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Streamline Land Demarcation Management
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                Digital tracking system for plot-wise demarcation activities, reducing disputes and improving administrative efficiency in Mahendragarh district.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleLogin}
                  className="bg-white text-primary px-8 py-3 hover:bg-neutral-50"
                >
                  Start Tracking
                </Button>
              </div>
            </div>
            <div className="relative">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-8">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-secondary/20 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold">234</div>
                      <div className="text-sm text-blue-200">Active Plots</div>
                    </div>
                    <div className="bg-accent/20 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold">12</div>
                      <div className="text-sm text-blue-200">Pending Cases</div>
                    </div>
                    <div className="bg-green-500/20 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold">89%</div>
                      <div className="text-sm text-blue-200">Resolution Rate</div>
                    </div>
                  </div>
                  <div className="text-center text-blue-200">
                    <ChartLine className="mx-auto text-4xl mb-2" />
                    <p>Real-time tracking dashboard</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-neutral-800 mb-4">
              Comprehensive Land Management Solution
            </h3>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
              Designed specifically for revenue officers and administrators to efficiently track, manage, and resolve land demarcation activities.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ClipboardList className="text-primary text-2xl" />
              </div>
              <h4 className="text-xl font-semibold mb-4">Plot-wise Tracking</h4>
              <p className="text-neutral-600">
                Log and monitor demarcation activities for each plot with detailed timestamps and officer assignments.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <History className="text-secondary text-2xl" />
              </div>
              <h4 className="text-xl font-semibold mb-4">Historical Records</h4>
              <p className="text-neutral-600">
                Maintain comprehensive ledger of all historical and current demarcation activities for complete audit trails.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="text-accent text-2xl" />
              </div>
              <h4 className="text-xl font-semibold mb-4">Duplicate Detection</h4>
              <p className="text-neutral-600">
                Automatically identify and flag duplicate entries to prevent conflicts and streamline resolution processes.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Gauge className="text-purple-600 text-2xl" />
              </div>
              <h4 className="text-xl font-semibold mb-4">Administrative Dashboard</h4>
              <p className="text-neutral-600">
                District and circle-level dashboards provide real-time visibility into officer activities and case statuses.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Clock className="text-red-600 text-2xl" />
              </div>
              <h4 className="text-xl font-semibold mb-4">Pendency Tracking</h4>
              <p className="text-neutral-600">
                Monitor file pendency and case resolution timelines to ensure timely completion of demarcation activities.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="text-green-600 text-2xl" />
              </div>
              <h4 className="text-xl font-semibold mb-4">Multi-level Access</h4>
              <p className="text-neutral-600">
                Role-based access control for officers, supervisors, and administrators with appropriate permission levels.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
