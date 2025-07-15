import { Switch, Route, Link, useLocation } from "wouter";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  FileText, 
  Settings, 
  BarChart3, 
  Menu, 
  X,
  Upload,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  LogOut
} from "lucide-react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import PolicySummaryGenerator from "@/pages/PolicySummaryGenerator";
import NotFound from "@/pages/not-found";
import { DocumentDashboard } from "@/components/DocumentDashboard";
import { UserSettings } from "@/components/UserSettings";
import { AuthPage } from "@/components/AuthPage";
import { ThemeProvider, useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

function Navigation({ 
  isSidebarCollapsed, 
  setIsSidebarCollapsed 
}: {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
}) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { logout, isLoggingOut, agent } = useAuth();

  const navigationItems = [
    { path: "/", label: "Upload & Process", icon: Upload },
    { path: "/dashboard", label: "Document Dashboard", icon: BarChart3 },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  const getThemeIcon = () => {
    switch (theme) {
      case "light": return Sun;
      case "dark": return Moon;
      default: return Monitor;
    }
  };

  const toggleTheme = () => {
    const themes = ["light", "dark", "system"] as const;
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

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
            ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium" 
            : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
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
        <div className={`flex flex-col flex-grow pt-5 border-r border-border bg-card text-card-foreground overflow-y-auto transition-colors duration-300`}>
          <div className={`flex items-center flex-shrink-0 relative ${isSidebarCollapsed ? 'px-2' : 'px-4'}`}>
            <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            {!isSidebarCollapsed && (
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-foreground">Policy Processor</h1>
                <Badge variant="outline" className="text-xs">Valley Trust Insurance</Badge>
              </div>
            )}
            
            {/* Collapse Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={`absolute ${isSidebarCollapsed ? 'right-1 bottom-2' : 'right-2 top-1/2 -translate-y-1/2'} h-6 w-6 p-0 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 border-0 rounded-full transition-all duration-300 opacity-70 hover:opacity-100 hover:scale-110`}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-3 h-3" />
              ) : (
                <ChevronLeft className="w-3 h-3" />
              )}
            </Button>
          </div>
          
          <div className="mt-8 flex-grow flex flex-col">
            <nav className={`flex-1 space-y-2 ${isSidebarCollapsed ? 'px-2' : 'px-4'}`}>
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
            
            {/* Theme Toggle */}
            <div className={`${isSidebarCollapsed ? 'px-2' : 'px-4'} pb-4 mt-auto`}>
              <Separator className="mb-4" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleTheme}
                    className={`w-full ${isSidebarCollapsed ? 'justify-center px-2' : 'justify-start space-x-2'} text-muted-foreground hover:text-foreground hover:bg-accent`}
                  >
                    {(() => {
                      const ThemeIcon = getThemeIcon();
                      return <ThemeIcon className="w-4 h-4" />;
                    })()}
                    {!isSidebarCollapsed && <span className="capitalize">{theme} Mode</span>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Switch to {theme === "light" ? "dark" : theme === "dark" ? "system" : "light"} mode</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    disabled={isLoggingOut}
                    className={`w-full ${isSidebarCollapsed ? 'justify-center px-2' : 'justify-start space-x-2'} text-muted-foreground hover:text-foreground hover:bg-accent`}
                  >
                    <LogOut className="w-4 h-4" />
                    {!isSidebarCollapsed && <span>Logout</span>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Logout</p>
                </TooltipContent>
              </Tooltip>
              
              {!isSidebarCollapsed && (
                <div className="text-xs text-muted-foreground mt-3">
                  <p>Intelligent document processing</p>
                  <p>powered by AI</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden bg-card border-b border-border px-4 py-3 transition-colors duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-foreground">Policy Processor</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {agent?.username}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="w-8 h-8 p-0"
            >
              {(() => {
                const ThemeIcon = getThemeIcon();
                return <ThemeIcon className="w-4 h-4" />;
              })()}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              disabled={isLoggingOut}
              className="w-8 h-8 p-0"
            >
              <LogOut className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
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
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {agent?.username}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                disabled={isLoggingOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

function SummaryView(props: any) {
  return <PolicySummaryGenerator documentId={props.params?.id} />;
}

function PolicySummaryGeneratorWrapper() {
  return <PolicySummaryGenerator />;
}

function AuthenticatedRouter() {
  return (
    <Switch>
      <Route path="/" component={PolicySummaryGeneratorWrapper} />
      <Route path="/summary/:id" component={SummaryView} />
      <Route path="/dashboard" component={DocumentDashboard} />
      <Route path="/settings" component={UserSettings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp({ isSidebarCollapsed, setIsSidebarCollapsed }: {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Navigation 
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
      />
      
      {/* Main Content */}
      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'md:pl-16' : 'md:pl-64'}`}>
        <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8">
          <AuthenticatedRouter />
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { isAuthenticated, isLoading, agent } = useAuth();

  console.log('AppContent - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading, 'agent:', agent);

  // Show loading state while checking authentication
  if (isLoading) {
    console.log('AppContent - Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show appropriate content based on authentication status
  if (isAuthenticated) {
    console.log('AppContent - Showing authenticated app');
    return (
      <AuthenticatedApp 
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
      />
    );
  } else {
    console.log('AppContent - Showing auth page');
    return <AuthPage />;
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="valley-trust-theme">
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
