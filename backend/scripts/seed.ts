import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { AdminModel, StudentModel, DriveModel, ApplicationModel } from '../src/models';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is missing.');
  process.exit(1);
}

const COLLEGE_EMAIL_DOMAIN = process.env.COLLEGE_EMAIL_DOMAIN || 'college.edu';

async function seed() {
  console.log('🌱 Connecting to database...');
  await mongoose.connect(MONGODB_URI!);
  console.log('✅ Connected.');

  // Clean data
  console.log('🧹 Cleaning existing data...');
  await ApplicationModel.deleteMany({});
  await DriveModel.deleteMany({});
  await StudentModel.deleteMany({});
  await AdminModel.deleteMany({});
  console.log('✅ Cleaned.');

  // 1. Admin
  const adminId = new mongoose.Types.ObjectId('668500000000000000000001');
  const admin = await AdminModel.create({
    _id: adminId,
    name: 'Professor TPO',
    email: `tpo@${COLLEGE_EMAIL_DOMAIN}`,
    role: 'tpo',
  });
  console.log(`👤 Seeded Admin: ${admin.name}`);

  // 2. 5 Students
  const students = [
    {
      _id: new mongoose.Types.ObjectId('668500000000000000000002'),
      roll_no: 'CS22B1001',
      name: 'Aarav Sharma',
      branch: 'Computer Science',
      cgpa: 9.2,
      phone: '+919876543210',
      email: `aarav@${COLLEGE_EMAIL_DOMAIN}`,
      resume_url: 'https://supabase.co/storage/v1/object/public/resumes/aarav_resume.pdf',
      skills: ['TypeScript', 'Node.js', 'React', 'PostgreSQL'],
      links: { github: 'https://github.com/aarav-sharma', linkedin: 'https://linkedin.com/in/aarav-sharma' },
    },
    {
      _id: new mongoose.Types.ObjectId('668500000000000000000003'),
      roll_no: 'EC22B1002',
      name: 'Diya Patel',
      branch: 'Electronics',
      cgpa: 8.7,
      phone: '+919876543211',
      email: `diya@${COLLEGE_EMAIL_DOMAIN}`,
      resume_url: 'https://supabase.co/storage/v1/object/public/resumes/diya_resume.pdf',
      skills: ['Python', 'Embedded C', 'MATLAB'],
      links: { github: 'https://github.com/diya-patel', linkedin: 'https://linkedin.com/in/diya-patel' },
    },
    {
      _id: new mongoose.Types.ObjectId('668500000000000000000004'),
      roll_no: 'ME22B1003',
      name: 'Kabir Mehta',
      branch: 'Mechanical',
      cgpa: 7.9,
      phone: '+919876543212',
      email: `kabir@${COLLEGE_EMAIL_DOMAIN}`,
      resume_url: 'https://supabase.co/storage/v1/object/public/resumes/kabir_resume.pdf',
      skills: ['AutoCAD', 'SolidWorks', 'Thermodynamics'],
      links: { github: 'https://github.com/kabir-mehta', linkedin: 'https://linkedin.com/in/kabir-mehta' },
    },
    {
      _id: new mongoose.Types.ObjectId('668500000000000000000005'),
      roll_no: 'CS22B1004',
      name: 'Isha Sen',
      branch: 'Computer Science',
      cgpa: 9.5,
      phone: '+919876543213',
      email: `isha@${COLLEGE_EMAIL_DOMAIN}`,
      resume_url: 'https://supabase.co/storage/v1/object/public/resumes/isha_resume.pdf',
      skills: ['Rust', 'C++', 'Go', 'Docker'],
      links: { github: 'https://github.com/isha-sen', linkedin: 'https://linkedin.com/in/isha-sen' },
    },
    {
      _id: new mongoose.Types.ObjectId('668500000000000000000006'),
      roll_no: 'EE22B1005',
      name: 'Rohan Das',
      branch: 'Electrical',
      cgpa: 8.1,
      phone: '+919876543214',
      email: `rohan@${COLLEGE_EMAIL_DOMAIN}`,
      resume_url: 'https://supabase.co/storage/v1/object/public/resumes/rohan_resume.pdf',
      skills: ['Power Systems', 'Control Theory', 'Arduino'],
      links: { github: 'https://github.com/rohan-das', linkedin: 'https://linkedin.com/in/rohan-das' },
    },
  ];

  await StudentModel.create(students);
  console.log(`🎓 Seeded ${students.length} Students.`);

  // 3. 2 Drives
  const drive1Id = new mongoose.Types.ObjectId('668500000000000000000007');
  const drive2Id = new mongoose.Types.ObjectId('668500000000000000000008');

  const drives = [
    {
      _id: drive1Id,
      company_name: 'TechCorp Solutions',
      role: 'Software Engineer Intern',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      source_type: 'native',
      custom_fields: [
        { key: 'coverLetter', label: 'Why do you want to join?', type: 'text', required: true },
        { key: 'earliestStartDate', label: 'Earliest Start Date', type: 'date', required: false }
      ],
      status: 'open',
      created_by: adminId,
    },
    {
      _id: drive2Id,
      company_name: 'Fintech Innovations',
      role: 'Data Analyst',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      source_type: 'google_form',
      google_form_url: 'https://forms.gle/xyzFintechAnalytics',
      field_mapping: { email: 'entry.12345', name: 'entry.67890' },
      custom_fields: [],
      status: 'draft',
      created_by: adminId,
    },
  ];

  await DriveModel.create(drives);
  console.log(`💼 Seeded ${drives.length} Drives.`);

  // 4. 2 Applications
  const applications = [
    {
      _id: new mongoose.Types.ObjectId('668500000000000000000009'),
      student_id: students[0]._id, // Aarav
      drive_id: drive1Id, // TechCorp
      custom_answers: { coverLetter: 'I am highly passionate about full stack development.' },
      status: 'applied',
    },
    {
      _id: new mongoose.Types.ObjectId('66850000000000000000000a'),
      student_id: students[3]._id, // Isha
      drive_id: drive1Id, // TechCorp
      custom_answers: { coverLetter: 'I have extensive experience building systems in Rust.' },
      status: 'shortlisted',
    },
  ];

  await ApplicationModel.create(applications);
  console.log(`📝 Seeded ${applications.length} Applications.`);

  console.log('🎉 Database seeding completed successfully.');
}

seed()
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  })
  .finally(() => {
    mongoose.disconnect();
  });
