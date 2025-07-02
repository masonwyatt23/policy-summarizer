import { Switch, Route, Link, useLocation } from "wouter";
import { useState } from "react";
import { 
  FileText, 
  Settings, 
  BarChart3, 
  Menu, 
  X,
  Upload,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import PolicySummaryGenerator from "@/pages/PolicySummaryGenerator";
import NotFound from "@/pages/not-found";
import { DocumentDashboard } from "@/components/DocumentDashboard";
import { UserSettings } from "@/components/UserSettings";

function Navigation() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const navigationItems = [
    { path: "/", label: "Upload & Process", icon: Upload },
    { path: "/dashboard", label: "Document Dashboard", icon: BarChart3 },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  const NavItem = ({ path, label, icon: Icon, isActive }: { 
    path: string; 
    label: string; 
    icon: any; 
    isActive: boolean;
  }) => (
    <Link href={path}>
      <div
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
          isActive 
            ? "bg-blue-100 text-blue-700 font-medium" 
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </div>
    </Link>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow pt-5 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <FileText className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-gray-900">Policy Processor</h1>
              <Badge variant="outline" className="text-xs">Valley Trust Insurance</Badge>
            </div>
          </div>
          
          <div className="mt-8 flex-grow flex flex-col">
            <nav className="flex-1 px-4 space-y-2">
              {navigationItems.map((item) => (
                <NavItem
                  key={item.path}
                  path={item.path}
                  label={item.label}
                  icon={item.icon}
                  isActive={location === item.path}
                />
              ))}
            </nav>
            
            <div className="px-4 pb-4">
              <Separator className="mb-4" />
              <div className="text-xs text-gray-500">
                <p>Intelligent document processing</p>
                <p>powered by AI</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <span className="font-semibold text-gray-900">Policy Processor</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200">
          <nav className="px-4 py-3 space-y-2">
            {navigationItems.map((item) => (
              <NavItem
                key={item.path}
                path={item.path}
                label={item.label}
                icon={item.icon}
                isActive={location === item.path}
              />
            ))}
          </nav>
        </div>
      )}
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={PolicySummaryGenerator} />
      <Route path="/dashboard" component={DocumentDashboard} />
      <Route path="/settings" component={UserSettings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          
          {/* Main Content */}
          <div className="md:pl-64">
            <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8">
              <Router />
            </div>
          </div>
        </div>
        
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
