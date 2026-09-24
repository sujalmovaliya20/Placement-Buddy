import { DriveModel, ApplicationModel, StudentModel } from '../models';

export const adminAnalyticsService = {
  async getOverview() {
    // 1. Total drives by status
    const drivesData = await DriveModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const totalDrives = drivesData.map((d: any) => ({
      status: d._id,
      count: d.count,
    }));

    // 2. Total applications
    const totalApplications = await ApplicationModel.countDocuments();

    // 3. Unique students applied
    const uniqueStudentIds = await ApplicationModel.distinct('student_id');
    const totalUniqueStudents = uniqueStudentIds.length;

    // 4. Total students in system
    const totalStudents = await StudentModel.countDocuments();

    // 5. Never applied students
    const neverAppliedStudents = await StudentModel.find({ _id: { $nin: uniqueStudentIds } })
      .select('_id enrollment_number first_name last_name course contact_number email')
      .lean();

    // 6. Company ranking (applications per company)
    const companyRankingPipeline = [
      {
        $lookup: {
          from: 'drives',
          localField: 'drive_id',
          foreignField: '_id',
          as: 'drive'
        }
      },
      { $unwind: '$drive' },
      { $group: { _id: '$drive.company_name', count: { $sum: 1 } } },
      { $sort: { count: -1 } as const },
      { $limit: 10 }
    ];
    const companyData = await ApplicationModel.aggregate(companyRankingPipeline);
    const companyRanking = companyData.map((d: any) => ({
      company: d._id,
      count: d.count,
    }));

    // 7. Branch Participation
    const branchAppliedPipeline = [
      {
        $lookup: {
          from: 'students',
          localField: 'student_id',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      { $group: { _id: '$student.course', uniqueStudents: { $addToSet: '$student._id' } } },
      { $project: { _id: 1, count: { $size: '$uniqueStudents' } } }
    ];
    const branchAppliedData = await ApplicationModel.aggregate(branchAppliedPipeline);
    const appliedMap = new Map(branchAppliedData.map((d: any) => [d._id, d.count]));

    const branchTotalData = await StudentModel.aggregate([
      { $group: { _id: '$course', count: { $sum: 1 } } }
    ]);
    
    const branchParticipation = branchTotalData.map((d: any) => {
      const applied = appliedMap.get(d._id) || 0;
      const total = d.count;
      const rate = total > 0 ? (applied / total) * 100 : 0;
      return {
        course: d._id || 'Unknown',
        applied,
        total,
        rate: parseFloat(rate.toFixed(1)),
      };
    });

    // 8. Timeline (Trend over time)
    // Grouping by week (using $dateToString to ISO week format for simplicity, or just '%Y-%U')
    // We'll use Year-Month for cleaner high-level trend.
    const timelinePipeline = [
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$applied_at' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } as const }
    ];
    const timelineData = await ApplicationModel.aggregate(timelinePipeline);
    const timeline = timelineData.map((d: any) => ({
      date: d._id,
      count: d.count,
    }));

    return {
      totalDrives,
      totalApplications,
      totalUniqueStudents,
      totalStudents,
      companyRanking,
      branchParticipation,
      timeline,
      neverAppliedStudents: neverAppliedStudents.map(s => ({
        _id: s._id.toString(),
        enrollment_number: s.enrollment_number,
        first_name: s.first_name,
        last_name: s.last_name,
        course: s.course,
        contact_number: s.contact_number,
        email: s.email,
      }))
    };
  }
};
