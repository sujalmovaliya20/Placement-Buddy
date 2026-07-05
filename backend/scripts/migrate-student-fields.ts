import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is missing.');
  process.exit(1);
}

async function migrate() {
  console.log('🔄 Connecting to database for migration...');
  await mongoose.connect(MONGODB_URI!);
  console.log('✅ Connected.');

  const db = mongoose.connection.db;
  const studentsCollection = db.collection('students');

  console.log('📋 Fetching students...');
  const students = await studentsCollection.find({}).toArray();
  console.log(`Found ${students.length} students to migrate.`);

  let migratedCount = 0;
  let flaggedCount = 0;
  const report: string[] = [];

  for (const student of students) {
    const studentId = student._id.toString();
    const updateDoc: any = {};
    const unsetFields: any = {};
    const flags: string[] = [];

    // 1. Name -> first_name & last_name
    if (student.name) {
      const nameParts = student.name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      updateDoc.first_name = firstName;
      updateDoc.last_name = lastName;

      if (!lastName) {
        flags.push(`Missing last name (name was "${student.name}")`);
        updateDoc.last_name = '.'; // Set fallback to satisfy required validation
      }
      unsetFields.name = '';
    } else if (!student.first_name) {
      updateDoc.first_name = 'Unknown';
      updateDoc.last_name = 'Unknown';
      flags.push('No name field present');
    }

    // 2. roll_no -> enrollment_number
    if (student.roll_no) {
      updateDoc.enrollment_number = student.roll_no;
      unsetFields.roll_no = '';
    } else if (!student.enrollment_number) {
      updateDoc.enrollment_number = `TEMP-${studentId.substring(18)}`;
      flags.push('No roll_no/enrollment_number present, assigned temporary');
    }

    // 3. branch -> course
    if (student.branch) {
      updateDoc.course = student.branch;
      unsetFields.branch = '';
    } else if (!student.course) {
      updateDoc.course = 'Unknown Course';
      flags.push('No branch/course present');
    }

    // 4. cgpa -> cgpa_previous_semester
    if (student.cgpa !== undefined) {
      updateDoc.cgpa_previous_semester = Number(student.cgpa);
      unsetFields.cgpa = '';
    } else if (student.cgpa_previous_semester === undefined) {
      updateDoc.cgpa_previous_semester = 0.0;
      flags.push('No cgpa present, defaulted to 0.0');
    }

    // 5. phone -> contact_number (validate 10 digit Indian number)
    if (student.phone) {
      // Clean up phone number: remove non-digits
      const digits = student.phone.replace(/\D/g, '');
      // If starts with 91 and has 12 digits, take last 10
      let cleanPhone = digits;
      if (digits.startsWith('91') && digits.length === 12) {
        cleanPhone = digits.substring(2);
      } else if (digits.length > 10) {
        cleanPhone = digits.slice(-10);
      }
      
      updateDoc.contact_number = cleanPhone;

      // Verify cleanPhone matches Indian format
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        flags.push(`Contact number "${student.phone}" parsed to "${cleanPhone}" which is not a valid 10-digit Indian mobile number`);
      }
      unsetFields.phone = '';
    } else if (!student.contact_number) {
      updateDoc.contact_number = '9999999999';
      flags.push('No phone/contact_number present, defaulted to 9999999999');
    }

    // 6. date_of_birth (Date, required)
    if (!student.date_of_birth) {
      updateDoc.date_of_birth = new Date('2000-01-01');
      flags.push('No date_of_birth present, defaulted to 2000-01-01');
    }

    // 7. tenth_result (Number, required, min:0, max:100)
    if (student.tenth_result === undefined) {
      updateDoc.tenth_result = 75.0;
      flags.push('No tenth_result present, defaulted to 75.0%');
    }

    // 8. twelfth_result (Number, required, min:0, max:100)
    if (student.twelfth_result === undefined) {
      updateDoc.twelfth_result = 75.0;
      flags.push('No twelfth_result present, defaulted to 75.0%');
    }

    // 9. experience_months
    if (student.experience_months === undefined) {
      updateDoc.experience_months = 0;
    }

    // Apply the updates to MongoDB
    const updatePayload: any = {};
    if (Object.keys(updateDoc).length > 0) {
      updatePayload.$set = updateDoc;
    }
    if (Object.keys(unsetFields).length > 0) {
      updatePayload.$unset = unsetFields;
    }

    if (Object.keys(updatePayload).length > 0) {
      await studentsCollection.updateOne({ _id: student._id }, updatePayload);
      migratedCount++;
    }

    if (flags.length > 0) {
      flaggedCount++;
      report.push(`ID: ${studentId} | Email: ${student.email || 'N/A'}`);
      flags.forEach((f) => report.push(`  - ${f}`));
    }
  }

  console.log('\n========================================');
  console.log('🎉 Migration Completed successfully!');
  console.log(`Migrated / Updated records: ${migratedCount}`);
  console.log(`Records flagged for manual admin fix: ${flaggedCount}`);
  console.log('========================================\n');

  if (report.length > 0) {
    console.log('📋 Migration Correction Report:');
    console.log(report.join('\n'));
    
    // Write report to file
    const reportPath = path.resolve(__dirname, '../migration-report.txt');
    require('fs').writeFileSync(reportPath, report.join('\n'), 'utf-8');
    console.log(`\nReport written to: ${reportPath}`);
  }

  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
