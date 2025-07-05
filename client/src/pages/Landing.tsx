import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileText, BarChart, Users } from "lucide-react";

export default function Landing() {
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
          <Button onClick={() => window.location.href = '/api/login'} size="lg">
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Policy Intelligence
            <span className="text-blue-600 block">Platform</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Transform complex insurance documents into clear, actionable insights with 
            cutting-edge AI. Professional policy analysis and client-ready summaries.
          </p>
          <Button 
            onClick={() => window.location.href = '/api/login'} 
            size="lg" 
            className="text-lg px-8 py-3"
          >
            Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-600" />
                Document Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Upload PDF and DOCX policy documents for instant AI-powered analysis 
                and data extraction.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-6 w-6 text-blue-600" />
                Intelligent Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Advanced AI extracts key coverage details, exclusions, and benefits 
                with precision and accuracy.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-blue-600" />
                Client Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Generate professional, branded PDF summaries tailored for 
                client presentation and understanding.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="border-0 shadow-lg bg-blue-50 dark:bg-blue-900/20 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">
                Ready to Transform Your Policy Analysis?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Join Valley Trust Insurance agents using AI-powered document intelligence 
                to deliver exceptional client service.
              </p>
              <Button 
                onClick={() => window.location.href = '/api/login'} 
                size="lg"
                className="w-full md:w-auto"
              >
                Access Platform
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-slate-900 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2025 Valley Trust Insurance. All rights reserved.</p>
          <p className="mt-2">Anchoring You Through Life's Tough Storms</p>
        </div>
      </footer>
    </div>
  );
}