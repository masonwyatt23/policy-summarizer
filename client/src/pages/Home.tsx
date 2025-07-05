import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileText, Plus, LogOut } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Navigation */}
      <nav className="border-b bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Valley Trust Insurance
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2">
                {user.profileImageUrl && (
                  <img 
                    src={user.profileImageUrl} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <span className="text-gray-700 dark:text-gray-300">
                  {user.firstName || user.email}
                </span>
              </div>
            )}
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user?.firstName || 'Agent'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your insurance policy documents and create client summaries.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
            <Link href="/policy-summary-generator">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-6 w-6 text-blue-600" />
                  Process New Policy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Upload and analyze a new insurance policy document with AI-powered extraction.
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
            <Link href="/documents">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                  Document Library
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Browse, search, and manage your processed insurance documents.
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
            <Link href="/settings">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-6 w-6 text-blue-600" />
                  Agent Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Configure your agent profile, processing preferences, and export settings.
                </p>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Getting Started Guide */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Getting Started with Policy Intelligence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold text-lg">1</span>
                </div>
                <h3 className="font-semibold mb-2">Upload Documents</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Drag and drop PDF or DOCX policy files for analysis.
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold text-lg">2</span>
                </div>
                <h3 className="font-semibold mb-2">Review Analysis</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Our AI extracts key policy details and creates summaries.
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold text-lg">3</span>
                </div>
                <h3 className="font-semibold mb-2">Export Reports</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Generate professional PDFs with your agency branding.
                </p>
              </div>
            </div>
            <div className="text-center pt-4">
              <Link href="/policy-summary-generator">
                <Button size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Process Your First Policy
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}