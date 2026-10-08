# Excel WhatsApp Sender (Baileys Engine)

A standalone Node.js tool to send personalized WhatsApp messages and optional QR codes directly from an Excel spreadsheet (`.xlsx`, `.xls`, `.csv`).

Uses `@whiskeysockets/baileys` for reliable WhatsApp Web protocol automation and `xlsx` for Excel data handling.

---

## 🚀 Features

- 📊 **Excel Integration**: Read contacts, names, company names, or any custom column directly from `.xlsx`, `.xls`, or `.csv` files.
- 🔄 **Live Status Tracking**: Automatically updates the Excel sheet with `WhatsApp_Status` (`SENT` or `FAILED`) and `Sent_At` timestamp after each message.
- 🛡️ **Resume-Safe**: If stopped or interrupted, re-running the script will only send messages to pending rows (prevents duplicates).
- 🏷️ **Dynamic Templating**: Define customizable templates using `{ColumnName}` tags (e.g. `{Name}`, `{Company}`, `{Code}`).
- 📱 **QR Code Attachments**: Automatically generates and attaches a QR code image if a `Code` or `attendance_code` column is present.
- ⏳ **Anti-Ban Delays**: Random delay between messages (default 15s - 45s) to stay safe from WhatsApp spam detection.
- 🔐 **Persistent Authentication**: QR code scanning is only required once. Session data is saved securely in `./auth_info_baileys`.

---

## 📁 Setup & Quick Start

### 1. Install Dependencies
In the `excel-whatsapp-sender` directory:
```bash
npm install
```

### 2. Create a Sample Excel File (Optional)
If you don't have an Excel file ready yet, generate a demo file (`contacts.xlsx`):
```bash
npm run create-sample
```

### 3. Customize Your Message Template
Edit `template.txt` in the root folder. You can use any column name from your Excel sheet inside curly braces:
```text
Dear {Name},

You are cordially invited to our event!

📅 Date: Thursday, 24 September 2026
📍 Location: Ahmedabad

Your code is: *{Code}*

— Team Legrand
```

### 4. Configuration (`.env`)
Copy `.env.example` to `.env` or adjust `.env` parameters:
```env
EXCEL_FILE_PATH=contacts.xlsx
PHONE_COLUMN=Phone
MIN_DELAY_MS=15000
MAX_DELAY_MS=45000
SEND_TO_ALL=false
GENERATE_QR_CODE=true
```

### 5. Run the WhatsApp Sender
```bash
npm run start
```
1. Scan the displayed QR code with WhatsApp (*Linked Devices* on your phone).
2. Review the batch preview and press `[ENTER]` or type `y` to start.
