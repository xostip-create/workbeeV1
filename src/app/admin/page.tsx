
'use client';

import React from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  ArrowLeft, 
  Users, 
  CreditCard, 
  Briefcase, 
  BarChart3, 
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  UserCheck,
  UserX,
  ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

/**
 * Functional Admin Dashboard.
 * Pulls real-time data from Firestore to provide platform oversight.
 * Restricted to users with isAdmin: true.
 */
export default function AdminDashboardPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  // Fetch current user's profile to check isAdmin
  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);
  const { data: adminProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  // Fetch all users
  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'users'), limit(100));
  }, [db]);
  const { data: users, isLoading: isLoadingUsers } = useCollection(usersQuery);

  // Fetch all jobs
  const jobsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'jobs'), orderBy('createdAt', 'desc'), limit(100));
  }, [db]);
  const { data: jobs, isLoading: isLoadingJobs } = useCollection(jobsQuery);

  // Fetch all payments
  const paymentsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'payments'), orderBy('paidAt', 'desc'), limit(100));
  }, [db]);
  const { data: payments, isLoading: isLoadingPayments } = useCollection(paymentsQuery);

  const isLoading = isUserLoading || isProfileLoading || isLoadingUsers || isLoadingJobs || isLoadingPayments;

  const handleUpdateUserStatus = (userId: string, status: 'Approved' | 'Suspended') => {
    if (!db) return;
    const userRef = doc(db, 'users', userId);
    updateDocumentNonBlocking(userRef, { status });
    toast({
      title: `Worker ${status}`,
      description: `User account has been ${status.toLowerCase()} successfully.`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Auth Guard
  if (!user || !adminProfile?.isAdmin) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-4 text-center bg-slate-50">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
        <p className="text-slate-600 max-w-md mb-6">
          You do not have administrative privileges to access this area. If you believe this is an error, please contact the system administrator.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    );
  }

  // Calculate stats
  const totalRevenue = payments?.reduce((acc, p) => acc + (p.amount || 0), 0) || 0;
  const platformCommission = jobs?.reduce((acc, j) => acc + (j.commissionAmount || 0), 0) || 0;
  const activeJobs = jobs?.filter(j => j.status === 'In Progress').length || 0;
  const completedJobs = jobs?.filter(j => j.status === 'Completed').length || 0;
  const totalWorkers = users?.filter(u => u.accountType === 'Worker').length || 0;

  return (
    <div className="min-h-screen bg-muted/30 pb-12">
      {/* Dashboard Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon">
              <Link href="/">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold font-headline">Admin Control Center</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              System Live
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Admin: {adminProfile.name}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold font-headline">Hive Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">Real-time health and transaction metrics for WorkBee.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-none shadow-md overflow-hidden">
            <div className="h-1 bg-green-500 w-full" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
              <CreditCard className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                Processed via Paystack
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md overflow-hidden">
            <div className="h-1 bg-primary w-full" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
              <BarChart3 className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{platformCommission.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">10% Hive maintenance fee</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md overflow-hidden">
            <div className="h-1 bg-amber-500 w-full" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="w-4 h-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeJobs}</div>
              <p className="text-xs text-muted-foreground mt-1">{completedJobs} successfully finished</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md overflow-hidden">
            <div className="h-1 bg-purple-500 w-full" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Workers</CardTitle>
              <Users className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalWorkers}</div>
              <p className="text-xs text-muted-foreground mt-1">Out of {users?.length || 0} total users</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Data Tabs */}
        <Tabs defaultValue="jobs" className="space-y-6">
          <TabsList className="bg-white border p-1 rounded-xl">
            <TabsTrigger value="jobs" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Recent Jobs</TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">User Directory</TabsTrigger>
            <TabsTrigger value="payments" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Transaction Log</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Recent Job Requests</CardTitle>
                <CardDescription>View status and participants for current service requests.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Worker</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs?.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-bold">{job.title}</TableCell>
                        <TableCell>
                          <Badge variant={job.status === 'Completed' ? 'default' : job.status === 'In Progress' ? 'secondary' : 'outline'}>
                            {job.status || 'Open'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{job.customerId}</TableCell>
                        <TableCell className="text-xs">{job.selectedApplicantName || 'None Assigned'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Platform Users</CardTitle>
                <CardDescription>Manage both workers and customers. Approve or suspend workers to ensure quality.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Availability</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold">{u.name}</span>
                            <span className="text-[10px] text-muted-foreground">{u.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.accountType === 'Worker' ? 'default' : 'outline'}>
                            {u.accountType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={
                              u.status === 'Approved' ? 'bg-green-100 text-green-700' : 
                              u.status === 'Suspended' ? 'bg-red-100 text-red-700' : 
                              'bg-amber-100 text-amber-700'
                            }
                          >
                            {u.status || 'Approved'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {u.accountType === 'Worker' && (
                            <div className="flex items-center gap-1 text-[10px]">
                              {u.isAvailable !== false ? (
                                <><span className="w-2 h-2 bg-green-500 rounded-full" /> Available</>
                              ) : (
                                <><span className="w-2 h-2 bg-slate-400 rounded-full" /> Busy</>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {u.accountType === 'Worker' && (
                            <div className="flex justify-end gap-2">
                              {u.status !== 'Approved' && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8 text-[10px] border-green-200 text-green-700 hover:bg-green-50"
                                  onClick={() => handleUpdateUserStatus(u.id, 'Approved')}
                                >
                                  <UserCheck className="w-3 h-3 mr-1" /> Approve
                                </Button>
                              )}
                              {u.status !== 'Suspended' && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8 text-[10px] border-red-200 text-red-700 hover:bg-red-50"
                                  onClick={() => handleUpdateUserStatus(u.id, 'Suspended')}
                                >
                                  <UserX className="w-3 h-3 mr-1" /> Suspend
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Financial Transactions</CardTitle>
                <CardDescription>Complete log of payments processed via Paystack.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments?.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs font-medium">{p.jobId}</TableCell>
                        <TableCell className="font-bold">₦{(p.amount || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p.reference}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-green-100 text-green-700">Paid</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-6 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-blue-600 shrink-0" />
          <div>
            <h4 className="font-bold text-blue-900">Admin Responsibility</h4>
            <p className="text-sm text-blue-800 mt-1">
              Use this dashboard to monitor platform health. As an admin, you have the authority to suspend workers who violate platform terms or approve those who have completed verification.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
