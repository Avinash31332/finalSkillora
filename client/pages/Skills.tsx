import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import Header from '@/components/Header';
import { 
  Award, 
  Download, 
  FileText, 
  Star, 
  CheckCircle, 
  Plus, 
  User, 
  Calendar,
  Clock,
  Search,
  Trash2
} from 'lucide-react';

// Types
interface CompletionReport {
  id: string;
  tradeId: string;
  tradeTitle: string;
  completedBy: string;
  completedAt: string;
  reportText: string;
  deliverables: string[];
  skillsDemonstrated: string[];
  rating: number;
  feedback: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface Certificate {
  id: string;
  reportId: string;
  issuedAt: string;
  certificateUrl: string;
  verified: boolean;
  downloadCount: number;
}

interface Trade {
  id: string;
  title: string;
  description: string;
  skillOffered: string;
  skillWanted: string;
  userId: string;
  userDisplayName: string;
  status: 'Open' | 'Closed' | 'Assigned' | 'Completed';
  timestamp: any;
  assignedTo?: {
    userId: string;
    userDisplayName: string;
  };
  location?: string;
  deadline?: string;
}

const Skills: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { profile, hasProfile } = useProfile();
  
  // State management
  const [activeView, setActiveView] = useState<'certificates' | 'reports' | 'create-report' | 'sample-certificate'>('certificates');
  const [reports, setReports] = useState<CompletionReport[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  // Completion report form state
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [completionReport, setCompletionReport] = useState({
    reportText: '',
    deliverables: [''],
    skillsDemonstrated: [''],
    rating: 5,
    feedback: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock data for demonstration
  const mockReports: CompletionReport[] = [
    {
      id: '1',
      tradeId: 'trade1',
      tradeTitle: 'Web Development Project',
      completedBy: 'John Doe',
      completedAt: new Date().toISOString(),
      reportText: 'Successfully completed the web development project with modern React components and responsive design.',
      deliverables: ['Frontend React App', 'Responsive Design', 'API Integration'],
      skillsDemonstrated: ['React', 'JavaScript', 'CSS', 'API Integration'],
      rating: 5,
      feedback: 'Excellent work! The project exceeded expectations.',
      status: 'approved'
    }
  ];

  const mockCertificates: Certificate[] = [
    {
      id: '1',
      reportId: '1',
      issuedAt: new Date().toISOString(),
      certificateUrl: '/certificates/cert-1.pdf',
      verified: true,
      downloadCount: 3
    },
    {
      id: 'sample',
      reportId: 'sample',
      issuedAt: new Date().toISOString(),
      certificateUrl: '/certificates/sample.pdf',
      verified: true,
      downloadCount: 0
    }
  ];

  const mockTrades: Trade[] = [
    {
      id: 'trade1',
      title: 'Web Development Project',
      description: 'Need a React developer for a modern web application',
      skillOffered: 'Project Management',
      skillWanted: 'Web Development',
      userId: 'user1',
      userDisplayName: 'Project Owner',
      status: 'Completed',
      timestamp: { seconds: Date.now() / 1000 - 86400 },
      assignedTo: {
        userId: 'user2',
        userDisplayName: 'John Doe'
      },
      location: 'Remote'
    }
  ];

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setReports(mockReports);
        setCertificates(mockCertificates);
        setTrades(mockTrades);
        setError(null);
      } catch (err) {
        setError('Failed to load data');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      alert('Please sign in to create a completion report');
      return;
    }

    if (!selectedTrade) {
      setError('Please select a trade to report on');
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (!completionReport.reportText.trim()) {
        setError('Please provide a completion report');
        return;
      }

      const newReport: CompletionReport = {
        id: Date.now().toString(),
        tradeId: selectedTrade.id,
        tradeTitle: selectedTrade.title,
        completedBy: profile?.name || 'Anonymous User',
        completedAt: new Date().toISOString(),
        reportText: completionReport.reportText.trim(),
        deliverables: completionReport.deliverables.filter(d => d.trim()),
        skillsDemonstrated: completionReport.skillsDemonstrated.filter(s => s.trim()),
        rating: completionReport.rating,
        feedback: completionReport.feedback.trim(),
        status: 'pending'
      };

      setReports(prev => [newReport, ...prev]);
      
      setCompletionReport({
        reportText: '',
        deliverables: [''],
        skillsDemonstrated: [''],
        rating: 5,
        feedback: ''
      });
      setSelectedTrade(null);
      setActiveView('reports');
      setError(null);
      
    } catch (err) {
      setError('Failed to create completion report');
      console.error('Error creating report:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadCertificate = async (certificate: Certificate) => {
    try {
      const link = document.createElement('a');
      link.href = certificate.certificateUrl;
      link.download = `certificate-${certificate.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setCertificates(prev => prev.map(cert => 
        cert.id === certificate.id 
          ? { ...cert, downloadCount: cert.downloadCount + 1 }
          : cert
      ));
      
    } catch (err) {
      setError('Failed to download certificate');
      console.error('Error downloading certificate:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderCertificates = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Page Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Skills Certifications</h1>
              <p className="text-gray-600 mt-2">View and download your skill completion certificates</p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() => setActiveView('reports')}
                variant="outline"
                className="text-gray-600 hover:text-green-600"
              >
                <FileText className="w-4 h-4 mr-2" />
                Reports
              </Button>
              <Button
                onClick={() => setActiveView('sample-certificate')}
                variant="outline"
                className="text-blue-600 border-blue-600 hover:bg-blue-50 mr-4"
              >
                <FileText className="w-4 h-4 mr-2" />
                View Sample Certificate
              </Button>
              <Button
                onClick={() => setActiveView('create-report')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Report
              </Button>
            </div>
          </div>
        </div>

        {/* Certificates List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading certificates...</p>
          </div>
        ) : certificates.length === 0 ? (
          <div className="text-center py-12">
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No certificates yet</h3>
            <p className="text-gray-500 mb-6">
              Complete projects and create reports to earn certificates!
            </p>
            <Button
              onClick={() => setActiveView('create-report')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Report
            </Button>
          </div>
        ) : (
          <div className="grid gap-6">
            {certificates.map((certificate) => {
              const report = reports.find(r => r.id === certificate.reportId);
  return (
                <Card key={certificate.id} className="border border-gray-200 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <Award className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-green-600">
                            {certificate.id === 'sample' ? 'Sample Certificate' : (report?.tradeTitle || 'Project Completion Certificate')}
                          </CardTitle>
                          <p className="text-gray-500 text-sm">
                            {certificate.id === 'sample' ? 'Preview of certificate design' : `Issued ${formatDistanceToNow(new Date(certificate.issuedAt))} ago`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                        <Button
                          onClick={() => certificate.id === 'sample' ? setActiveView('sample-certificate') : handleDownloadCertificate(certificate)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {certificate.id === 'sample' ? (
                            <>
                              <FileText className="w-4 h-4 mr-2" />
                              View Sample
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Certificate Details</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            <span>Completed by: {report?.completedBy}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>Issued: {new Date(certificate.issuedAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center">
                            <Download className="w-4 h-4 mr-2" />
                            <span>Downloads: {certificate.downloadCount}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Skills Demonstrated</h4>
                        <div className="flex flex-wrap gap-2">
                          {report?.skillsDemonstrated.map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderCreateReport = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Page Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Completion Report</h1>
              <p className="text-gray-600 mt-2">Report on your completed project to earn a certificate</p>
            </div>
            <Button
              onClick={() => setActiveView('certificates')}
              variant="outline"
              className="text-gray-600 hover:text-green-600"
            >
              <Award className="w-4 h-4 mr-2" />
              View Certificates
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 border border-red-200">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Trade Selection */}
          <div className="lg:col-span-1">
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Select Completed Trade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trades.filter(trade => trade.status === 'Completed' || trade.status === 'Assigned').map((trade) => (
                    <div
                      key={trade.id}
                      className={cn(
                        "p-3 border rounded-lg cursor-pointer transition-colors",
                        selectedTrade?.id === trade.id
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      onClick={() => setSelectedTrade(trade)}
                    >
                      <h4 className="font-medium text-gray-900">{trade.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{trade.description}</p>
                      <div className="flex items-center text-xs text-gray-500 mt-2">
                        <User className="w-3 h-3 mr-1" />
                        <span>{trade.assignedTo?.userDisplayName || trade.userDisplayName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Report Form */}
          <div className="lg:col-span-2">
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Completion Report</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateReport} className="space-y-6">
                  <div>
                    <Label htmlFor="reportText" className="text-sm font-semibold text-gray-700">
                      Project Completion Report *
                    </Label>
                    <Textarea
                      id="reportText"
                      value={completionReport.reportText}
                      onChange={(e) => setCompletionReport(prev => ({ ...prev, reportText: e.target.value }))}
                      placeholder="Describe what you accomplished, challenges faced, and outcomes achieved..."
                      rows={6}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2">
                      Deliverables *
                    </Label>
                    <div className="space-y-2">
                      {completionReport.deliverables.map((deliverable, index) => (
                        <div key={index} className="flex space-x-2">
                          <Input
                            value={deliverable}
                            onChange={(e) => {
                              const newDeliverables = [...completionReport.deliverables];
                              newDeliverables[index] = e.target.value;
                              setCompletionReport(prev => ({ ...prev, deliverables: newDeliverables }));
                            }}
                            placeholder="Enter deliverable"
                            className="flex-1"
                          />
                          {completionReport.deliverables.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => {
                                const newDeliverables = completionReport.deliverables.filter((_, i) => i !== index);
                                setCompletionReport(prev => ({ ...prev, deliverables: newDeliverables }));
                              }}
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-300"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        onClick={() => setCompletionReport(prev => ({ 
                          ...prev, 
                          deliverables: [...prev.deliverables, ''] 
                        }))}
                        variant="outline"
                        size="sm"
                        className="text-green-600 border-green-300"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Deliverable
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2">
                      Skills Demonstrated *
                    </Label>
                    <div className="space-y-2">
                      {completionReport.skillsDemonstrated.map((skill, index) => (
                        <div key={index} className="flex space-x-2">
                          <Input
                            value={skill}
                            onChange={(e) => {
                              const newSkills = [...completionReport.skillsDemonstrated];
                              newSkills[index] = e.target.value;
                              setCompletionReport(prev => ({ ...prev, skillsDemonstrated: newSkills }));
                            }}
                            placeholder="Enter skill"
                            className="flex-1"
                          />
                          {completionReport.skillsDemonstrated.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => {
                                const newSkills = completionReport.skillsDemonstrated.filter((_, i) => i !== index);
                                setCompletionReport(prev => ({ ...prev, skillsDemonstrated: newSkills }));
                              }}
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-300"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        onClick={() => setCompletionReport(prev => ({ 
                          ...prev, 
                          skillsDemonstrated: [...prev.skillsDemonstrated, ''] 
                        }))}
                        variant="outline"
                        size="sm"
                        className="text-green-600 border-green-300"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Skill
                      </Button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rating" className="text-sm font-semibold text-gray-700">
                        Self Rating (1-5) *
                      </Label>
                      <div className="flex items-center space-x-2 mt-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => setCompletionReport(prev => ({ ...prev, rating }))}
                            className={cn(
                              "w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors",
                              completionReport.rating >= rating
                                ? "border-yellow-400 bg-yellow-100 text-yellow-800"
                                : "border-gray-300 text-gray-400 hover:border-yellow-300"
                            )}
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        ))}
                        <span className="text-sm text-gray-600 ml-2">
                          {completionReport.rating}/5
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="feedback" className="text-sm font-semibold text-gray-700">
                      Additional Feedback
                    </Label>
                    <Textarea
                      id="feedback"
                      value={completionReport.feedback}
                      onChange={(e) => setCompletionReport(prev => ({ ...prev, feedback: e.target.value }))}
                      placeholder="Any additional comments or feedback about the project..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveView('certificates')}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!selectedTrade || isSubmitting}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating...
                        </>
                      ) : (
                        'Create Report'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSampleCertificate = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />

      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Page Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sample Certificate</h1>
              <p className="text-gray-600 mt-2">Preview of what your certificate will look like</p>
            </div>
            <Button
              onClick={() => setActiveView('certificates')}
              variant="outline"
              className="text-gray-600 hover:text-green-600"
            >
              <Award className="w-4 h-4 mr-2" />
              Back to Certificates
            </Button>
          </div>
        </div>

        {/* Certificate Preview */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="max-w-4xl mx-auto">
            {/* Certificate Design */}
            <div className="relative bg-white border-4 border-blue-900 p-12 text-center">
              {/* Decorative corners */}
              <div className="absolute top-0 left-0 w-16 h-16">
                <div className="w-full h-full bg-blue-900 transform rotate-45 origin-center"></div>
                <div className="absolute top-2 left-2 w-12 h-12 bg-blue-200 transform rotate-45 origin-center"></div>
              </div>
              <div className="absolute bottom-0 right-0 w-16 h-16">
                <div className="w-full h-full bg-blue-900 transform rotate-45 origin-center"></div>
                <div className="absolute bottom-2 right-2 w-12 h-12 bg-blue-200 transform rotate-45 origin-center"></div>
              </div>

              {/* Certificate Content */}
              <div className="relative z-10">
                {/* Title */}
                <h1 className="text-5xl font-serif font-bold text-gray-900 mb-2">CERTIFICATE</h1>
                <h2 className="text-2xl font-sans font-semibold text-gray-700 mb-8">OF TRADE COMPLETION</h2>

                {/* Awardee */}
                <div className="mb-8">
                  <p className="text-lg text-gray-600 mb-4">THIS CERTIFICATE IS AWARDED TO</p>
                  <h3 className="text-4xl font-serif font-bold text-gray-900 mb-2">
                    {profile?.name || 'JOHN DOE'}
                  </h3>
                </div>

                {/* Description */}
                <div className="max-w-3xl mx-auto mb-12">
                  <p className="text-lg text-gray-700 leading-relaxed">
                    This trade, identified as Transaction ID <span className="font-mono font-semibold">TRD-2024-001</span>, 
                    exemplifies the core values of skill-sharing within our community. The professional exchange between 
                    parties has contributed to mutual growth and the successful acquisition of new skills.
                  </p>
                </div>

                {/* Signatures */}
                <div className="flex justify-between items-end mt-16">
                  <div className="text-center">
                    <div className="border-b-2 border-gray-400 w-32 mb-2"></div>
                    <p className="text-sm font-semibold text-gray-700">DANIEL GALLEGO</p>
                    <p className="text-xs text-gray-500">Founder</p>
                  </div>

                  {/* Emblem */}
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mb-2">
                      <div className="w-12 h-12 bg-yellow-300 rounded-full flex items-center justify-center">
                        <Award className="w-8 h-8 text-yellow-800" />
                      </div>
                    </div>
                    <div className="w-8 h-8 bg-yellow-400 transform rotate-45 mb-1"></div>
                    <div className="w-8 h-8 bg-yellow-400 transform rotate-45"></div>
                  </div>

                  <div className="text-center">
                    <div className="border-b-2 border-gray-400 w-32 mb-2"></div>
                    <p className="text-sm font-semibold text-gray-700">CHIAKI SATO</p>
                    <p className="text-xs text-gray-500">Manager</p>
                  </div>
                </div>

                {/* Date */}
                <div className="mt-8">
                  <p className="text-sm text-gray-500">
                    Issued on {new Date().toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 mt-8">
              <Button
                onClick={() => {
                  // Simulate certificate download
                  const element = document.createElement('a');
                  const file = new Blob(['Certificate content'], { type: 'text/plain' });
                  element.href = URL.createObjectURL(file);
                  element.download = 'certificate-sample.pdf';
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Sample
              </Button>
              <Button
                onClick={() => setActiveView('create-report')}
                variant="outline"
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your Certificate
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {activeView === 'certificates' && renderCertificates()}
      {activeView === 'create-report' && renderCreateReport()}
      {activeView === 'sample-certificate' && renderSampleCertificate()}
    </>
  );
};

export default Skills;
