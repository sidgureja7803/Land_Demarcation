import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Bell, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/plots", label: "My Plots" },
    { path: "/new-log", label: "New Log" },
    { path: "/history", label: "History" },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <MapPin className="text-white" />
              </div>
              <span className="text-lg font-semibold text-neutral-800">Land Tracker</span>
            </div>
            
            <div className="hidden md:flex space-x-6">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <Button 
                    variant="ghost" 
                    className={`px-1 py-2 font-medium ${
                      location === item.path 
                        ? "text-primary border-b-2 border-primary" 
                        : "text-neutral-600 hover:text-neutral-800"
                    }`}
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-neutral-400" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
            
            <div className="flex items-center space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.profileImageUrl || ""} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <div className="text-sm font-medium text-neutral-800">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-neutral-500 capitalize">
                  {user?.role?.replace('_', ' ')}
                </div>
              </div>
            </div>
            
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5 text-neutral-400" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
