# 📲 Excel WhatsApp Message Sender — Simple Guide

Welcome! This tool allows you to automatically send personalized WhatsApp messages, attendance codes, QR codes, or image posters directly from an Excel spreadsheet (`.xlsx`, `.xls`, or `.csv`).

It updates your Excel spreadsheet in real-time (`WhatsApp Sent = Yes`) so you never send duplicate messages to the same person.

---

## 📌 Quick Summary of Steps
1. **Prepare your Excel file** (or export CSV from the Admin Dashboard).
2. **Edit your message template** in `template.txt`.
3. **Open Terminal** and type `npm run start`.
4. **Scan the QR code** on your screen with WhatsApp on your mobile phone.
5. **Press Enter** to begin sending automatically!

---

## 📖 Step-by-Step Instructions

### Step 1: Open the Terminal / Command Prompt
1. Open **VS Code** (or Command Prompt / Terminal on your computer).
2. Make sure your command line is inside the `excel-whatsapp-sender` folder:
   ```bash
   cd excel-whatsapp-sender
   ```

---

### Step 2: Prepare Your Excel File
You can use **either** of the following:

- **Method A: Use Exported File from Website Admin Page (Recommended)**
  1. Click **"Export CSV"** on the website admin dashboard.
  2. Copy that downloaded CSV file into this `excel-whatsapp-sender` folder.
  3. Rename it to `contacts.xlsx` (or update `EXCEL_FILE_PATH` in `.env`).

- **Method B: Create a Sample Excel File to Edit**
  Run this command to create a demo file named `contacts.xlsx`:
  ```bash
  npm run create-sample
  ```
  You can double-click `contacts.xlsx` to open it in Microsoft Excel, edit names and phone numbers, then save and close it.

> 💡 **Required Excel Headers**:
> The Excel file works with these standard columns:
> - `Phone` (e.g. `+919876543210` or `9876543210`)
> - `Name` (Recipient's name)
> - `Company` (Company name)
> - `Code` (Attendance pass code)
> - `WhatsApp Sent` (Shows `Yes` or `No`. The tool updates this automatically!)

---

### Step 3: Customize Your WhatsApp Message
Open the file named **`template.txt`** in Notepad or VS Code and write your message.

You can use curly braces `{}` to insert values from your Excel spreadsheet automatically:
- `{Name}` → Replaced with person's name
- `{Company}` → Replaced with company name
- `{Code}` → Replaced with attendance code
- `{Date}` → Replaced with event date

**Example `template.txt`**:
```text
Dear {Name},

You are cordially invited to the Exclusive Legrand Experience Evening 🎉

📅 Date: Thursday, 24 September 2026
🕡 Time: 6:30 PM Onwards
📍 Venue: Megma Restaurant and Banquets, Odhav, Ahmedabad

Your attendance pass code is:
*{Code}*

Please show this code or the attached image at the entrance.

We look forward to welcoming you!

— Team Legrand
```
*(Save and close `template.txt` after editing).*

---

### Step 4 (Optional): Add an Image Poster or Banner
If you want to send an image (like an event poster or banner) along with the message text as a caption underneath:

1. Copy your poster image into this folder (e.g. name it `banner.jpg`).
2. Open the file **`.env`** in Notepad or VS Code.
3. Set the line:
   ```env
   ATTACHMENT_FILE_PATH=banner.jpg
   ```
4. Save the file. The program will now attach `banner.jpg` to every message!

*(Note: If no custom banner image is set, it will automatically send the dynamic QR Code image if a `Code` is present).*

---

### Step 5: Start the Sender Program
In your terminal, type:
```bash
npm run start
```

---

### Step 6: Link Your WhatsApp (First Time Only)
1. A **QR Code** made of black & white blocks will appear directly in your terminal screen.
2. Open **WhatsApp** on your mobile phone:
   - On Android: Tap the **3 dots** (top right) ➔ **Linked devices** ➔ **Link a device**.
   - On iPhone: Go to **Settings** (bottom right) ➔ **Linked devices** ➔ **Link a device**.
3. Point your phone camera at the computer screen to scan the QR code.
4. Once scanned, you will see `✅ WhatsApp successfully connected!`.

*(You only need to scan the QR code ONCE. Next time you run the program, it will connect automatically).*

---

### Step 7: Review Preview & Confirm Sending
1. The terminal will display a preview showing:
   - How many recipients are waiting to receive messages.
   - A sample preview of the first message.
2. Press **`[ENTER]`** or type **`y`** to start sending!
3. Sit back and relax — the script will process each row one by one with safe randomized pauses between messages to protect your account.

---

## ❓ Frequently Asked Questions & Troubleshooting

#### 1. What if my internet disconnects or I stop the program halfway?
- **No problem!** The program writes `Yes` under `WhatsApp Sent` in Excel immediately after each message is sent.
- When you run `npm run start` again, it will automatically skip anyone who already received a message and only send to the remaining pending contacts.

#### 2. How do I logout or switch to a different WhatsApp phone number?
- Simply delete the folder named `auth_info_baileys` inside `excel-whatsapp-sender`.
- Run `npm run start` again, and it will ask you to scan a new QR code.

#### 3. How fast does it send messages?
- By default, it waits 15 to 45 seconds between messages to protect your phone number from WhatsApp ban filters.
- You can adjust `MIN_DELAY_MS` and `MAX_DELAY_MS` in the `.env` file if needed (1000 ms = 1 second).

#### 4. How do I re-send messages to everyone (including previously sent contacts)?
- In `.env`, change `SEND_TO_ALL=false` to `SEND_TO_ALL=true`.
