export interface DriveAnalytics {
  totalApplications: number;
  statusBreakdown: {
    status: 'applied' | 'shortlisted' | 'rejected';
    count: number;
  }[];
  courseBreakdown: {
    course: string;
    count: number;
  }[];
  cgpaDistribution: {
    range: string;
    count: number;
  }[];
  timeline: {
    date: string;
    count: number;
  }[];
}

export interface GlobalAnalytics {
  totalDrives: { status: string; count: number }[];
  totalApplications: number;
  totalUniqueStudents: number;
  totalStudents: number;
  companyRanking: { company: string; count: number }[];
  branchParticipation: { course: string; applied: number; total: number; rate: number }[];
  timeline: { date: string; count: number }[];
  neverAppliedStudents: {
    _id: string;
    enrollment_number: string;
    first_name: string;
    last_name: string;
    course: string;
    contact_number: string;
    email: string;
  }[];
}
