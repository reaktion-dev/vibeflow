import ExcelJS from 'exceljs';
import { SpreadsheetModel, SheetModel, OFFICE_THEMES, CellFormatType } from '../types';

/**
 * Generates an audit-ready, multi-sheet Microsoft Excel (.xlsx) workbook
 * from a structured SpreadsheetModel AST with validated formulas and corporate styling.
 */
export async function generateXlsxBuffer(model: SpreadsheetModel): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Vibeflow Autonomous Agent Studio';
  workbook.created = new Date();

  const theme = OFFICE_THEMES[model.theme] ?? OFFICE_THEMES['corporate-navy'];
  const primaryArgb = 'FF' + theme.primary.replace('#', '');
  const secondaryArgb = 'FF' + theme.secondary.replace('#', '');
  const bgLightArgb = 'FF' + theme.bgLight.replace('#', '');
  const borderArgb = 'FF' + theme.border.replace('#', '');

  for (const sheetData of model.sheets) {
    const isLandscape = sheetData.orientation === 'landscape' || sheetData.columns.length >= 6;
    const worksheet = workbook.addWorksheet(sheetData.name, {
      views: sheetData.freezeHeader !== false ? [{ state: 'frozen', ySplit: 1 }] : undefined,
      properties: { tabColor: { argb: primaryArgb } },
      pageSetup: {
        orientation: isLandscape ? 'landscape' : 'portrait',
        paperSize: 1, // Letter
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 0.5,
          right: 0.5,
          top: 0.75,
          bottom: 0.75,
          header: 0.3,
          footer: 0.3,
        },
      },
    });

    // 1. Define Columns
    worksheet.columns = sheetData.columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || Math.max(col.header.length + 6, 14),
    }));

    // 2. Style Header Row
    const headerRow = worksheet.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: primaryArgb },
      };
      cell.font = {
        name: 'Segoe UI',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      };
      cell.border = {
        bottom: { style: 'medium', color: { argb: secondaryArgb } },
      };
    });

    // 3. Add Data Rows
    for (let rIdx = 0; rIdx < sheetData.rows.length; rIdx++) {
      const rowData = sheetData.rows[rIdx];
      const rowValues: Record<string, any> = {};

      for (const col of sheetData.columns) {
        const cell = rowData.cells[col.key];
        if (!cell) continue;

        if (cell.formula) {
          rowValues[col.key] = { formula: cell.formula, result: cell.value };
        } else {
          rowValues[col.key] = cell.value;
        }
      }

      const row = worksheet.addRow(rowValues);
      row.height = 22;

      const isTotalRow = !!rowData.isTotal;
      const isZebra = rIdx % 2 === 1 && !isTotalRow;

      // Apply Cell Styling & Number Formats
      sheetData.columns.forEach((col, cIdx) => {
        const cell = row.getCell(cIdx + 1);
        const cellData = rowData.cells[col.key];
        const formatType = cellData?.format || col.format || detectFormat(cellData?.value);

        // Alignment
        const align = cellData?.align || col.align || (formatType === 'text' ? 'left' : 'right');
        cell.alignment = { vertical: 'middle', horizontal: align };

        // Number Formatting
        cell.numFmt = getNumFmt(formatType);

        // Zebra / Background
        if (isTotalRow) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: bgLightArgb },
          };
          cell.font = {
            name: 'Segoe UI',
            size: 11,
            bold: true,
            color: { argb: primaryArgb },
          };
          cell.border = {
            top: { style: 'thin', color: { argb: borderArgb } },
            bottom: { style: 'double', color: { argb: primaryArgb } },
          };
        } else if (isZebra) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: bgLightArgb },
          };
          cell.font = { name: 'Segoe UI', size: 10, bold: !!cellData?.bold };
          cell.border = {
            bottom: { style: 'thin', color: { argb: borderArgb } },
          };
        } else {
          cell.font = { name: 'Segoe UI', size: 10, bold: !!cellData?.bold };
          cell.border = {
            bottom: { style: 'thin', color: { argb: borderArgb } },
          };
        }
      });
    }
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

function detectFormat(value: any): CellFormatType {
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') {
    if (value.startsWith('$') || value.includes('USD')) return 'currency';
    if (value.endsWith('%')) return 'percent';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'date';
  }
  return 'text';
}

function getNumFmt(format?: CellFormatType): string | undefined {
  switch (format) {
    case 'currency':
      return '$#,##0.00;($#,##0.00);"-"';
    case 'percent':
      return '0.0%';
    case 'number':
      return '#,##0.00';
    case 'date':
      return 'YYYY-MM-DD';
    default:
      return undefined;
  }
}
