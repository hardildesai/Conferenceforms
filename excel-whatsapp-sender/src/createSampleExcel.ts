import * as utils from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const targetFilePath = path.join(__dirname, '..', 'contacts.xlsx');

const sampleData = [
  {
    ID: 'reg-001',
    'Created At': '2026-09-20T10:30:00Z',
    Company: 'Apex Electricals',
    Name: 'Rajesh Sharma',
    Designation: 'Managing Director',
    Email: 'rajesh@apexelectricals.com',
    Phone: '+919876543210',
    Code: 'LEG-1001',
    'Email Sent': 'Yes',
    'WhatsApp Sent': 'No',
    Attended: 'No',
    'Attended At': '',
  },
  {
    ID: 'reg-002',
    'Created At': '2026-09-20T11:15:00Z',
    Company: 'BuildCon Systems',
    Name: 'Priya Patel',
    Designation: 'Chief Engineer',
    Email: 'priya@buildcon.in',
    Phone: '919876543211',
    Code: 'LEG-1002',
    'Email Sent': 'Yes',
    'WhatsApp Sent': 'No',
    Attended: 'No',
    'Attended At': '',
  },
  {
    ID: 'reg-003',
    'Created At': '2026-09-21T09:00:00Z',
    Company: 'Innovate Solutions',
    Name: 'Amit Kumar',
    Designation: 'Project Consultant',
    Email: 'amit@innovate.co.in',
    Phone: '+91 98765 43212',
    Code: 'LEG-1003',
    'Email Sent': 'No',
    'WhatsApp Sent': 'No',
    Attended: 'No',
    'Attended At': '',
  },
];

const worksheet = utils.utils.json_to_sheet(sampleData);
const workbook = utils.utils.book_new();
utils.utils.book_append_sheet(workbook, worksheet, 'Contacts');

utils.writeFile(workbook, targetFilePath);

console.log(`✅ Sample Excel file created successfully at:\n   ${targetFilePath}`);
console.log('\nYou can now edit contacts.xlsx with your actual contact list or test sending.');
