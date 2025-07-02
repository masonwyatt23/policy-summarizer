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

function Navigation({ 
  isSidebarCollapsed, 
  setIsSidebarCollapsed 
}: {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
}) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { path: "/", label: "Upload & Process", icon: Upload },
    { path: "/dashboard", label: "Document Dashboard", icon: BarChart3 },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  const NavItem = ({ path, label, icon: Icon, isActive, isCollapsed }: { 
    path: string; 
    label: string; 
    icon: any; 
    isActive: boolean;
    isCollapsed?: boolean;
  }) => (
    <Link href={path}>
      <div
        className={`flex items-center px-3 py-2 rounded-lg transition-colors cursor-pointer ${
          isCollapsed ? 'justify-center' : 'space-x-2'
        } ${
          isActive 
            ? "bg-blue-100 text-blue-700 font-medium" 
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
        title={isCollapsed ? label : undefined}
      >
        <Icon className="w-4 h-4" />
        {!isCollapsed && <span>{label}</span>}
      </div>
    </Link>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 transition-all duration-300 ${
        isSidebarCollapsed ? 'md:w-16' : 'md:w-64'
      }`}>
        <div className="flex flex-col flex-grow pt-5 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4 relative">
            <FileText className="w-8 h-8 text-blue-600" />
            {!isSidebarCollapsed && (
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-gray-900">Policy Processor</h1>
                <Badge variant="outline" className="text-xs">Valley Trust Insurance</Badge>
              </div>
            )}
            
            {/* Collapse Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`absolute ${isSidebarCollapsed ? 'right-2' : '-right-12'} top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-white border border-gray-200 shadow-sm hover:bg-gray-50`}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </Button>
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
                  isCollapsed={isSidebarCollapsed}
                />
              ))}
            </nav>
            
            {!isSidebarCollapsed && (
              <div className="px-4 pb-4">
                <Separator className="mb-4" />
                <div className="text-xs text-gray-500">
                  <p>Intelligent document processing</p>
                  <p>powered by AI</p>
                </div>
              </div>
            )}
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
                isCollapsed={false}
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50">
          <Navigation 
            isSidebarCollapsed={isSidebarCollapsed}
            setIsSidebarCollapsed={setIsSidebarCollapsed}
          />
          
          {/* Main Content */}
          <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'md:pl-16' : 'md:pl-64'}`}>
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
