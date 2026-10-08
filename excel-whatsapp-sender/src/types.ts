export interface ExcelRow {
  [key: string]: any;
}

export interface RecipientRecord {
  rowIndex: number; // 0-based index in Excel sheet array (row number in sheet is index + 2)
  phone: string;
  formattedJid: string;
  data: ExcelRow;
  status: string;
}
