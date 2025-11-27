import Papa from "papaparse";
import type { BulkImportQuestion } from "@/actions/admin/bulk-import";

export interface QuestionCSVRow {
  content: string;
  option1: string;
  option2: string;
  option3?: string;
  option4?: string;
  option5?: string;
  option6?: string;
  correctIndex: string;
  durationSec: string;
  mediaUrl?: string;
  soundUrl?: string;
  roundIndex?: string;
}

export interface ParseResult {
  success: boolean;
  data?: BulkImportQuestion[];
  errors?: Array<{ row: number; field: string; message: string }>;
}

/**
 * Parse CSV file containing questions
 */
export async function parseQuestionCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse<QuestionCSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      transform: (value) => value.trim(),
      complete: (results) => {
        const errors: Array<{ row: number; field: string; message: string }> =
          [];
        const validData: BulkImportQuestion[] = [];

        results.data.forEach((row, index) => {
          const rowNumber = index + 2; // +2 for header and 0-index

          // Validate required fields
          if (!row.content) {
            errors.push({
              row: rowNumber,
              field: "content",
              message: "Question content is required",
            });
          }

          // Collect all options (option1, option2, etc.)
          const options: string[] = [];
          for (let i = 1; i <= 6; i++) {
            const optionKey = `option${i}` as keyof QuestionCSVRow;
            const optionValue = row[optionKey];
            if (optionValue && typeof optionValue === "string") {
              options.push(optionValue);
            }
          }

          // Validate we have at least 2 options
          if (options.length < 2) {
            errors.push({
              row: rowNumber,
              field: "options",
              message: "At least 2 options are required",
            });
          }

          // Validate correctIndex
          const correctIndex = parseInt(row.correctIndex || "", 10);
          if (isNaN(correctIndex)) {
            errors.push({
              row: rowNumber,
              field: "correctIndex",
              message: "Correct index must be a number (0-based)",
            });
          } else if (correctIndex < 0 || correctIndex >= options.length) {
            errors.push({
              row: rowNumber,
              field: "correctIndex",
              message: `Correct index must be between 0 and ${
                options.length - 1
              }`,
            });
          }

          // Validate duration
          const duration = Number(row.durationSec);
          if (isNaN(duration) || duration < 5) {
            errors.push({
              row: rowNumber,
              field: "durationSec",
              message: "Duration must be at least 5 seconds",
            });
          }

          // If no errors for this row, add to valid data
          if (errors.filter((e) => e.row === rowNumber).length === 0) {
            validData.push({
              content: row.content,
              options,
              correctIndex,
              durationSec: duration,
              mediaUrl: row.mediaUrl || undefined,
              soundUrl: row.soundUrl || undefined,
              roundIndex: row.roundIndex
                ? parseInt(row.roundIndex, 10)
                : undefined,
            });
          }
        });

        if (errors.length > 0) {
          resolve({ success: false, errors });
        } else {
          resolve({ success: true, data: validData });
        }
      },
      error: (error) => {
        resolve({
          success: false,
          errors: [{ row: 0, field: "file", message: error.message }],
        });
      },
    });
  });
}

/**
 * Generate CSV template for download
 */
export function generateCSVTemplate(): string {
  const headers = [
    "content",
    "option1",
    "option2",
    "option3",
    "option4",
    "correctIndex",
    "durationSec",
    "mediaUrl",
    "soundUrl",
    "roundIndex",
  ];

  const exampleRows = [
    [
      "Who won the FIFA World Cup 2022?",
      "France",
      "Argentina",
      "Brazil",
      "Germany",
      "1", // 0-based index, so 1 = Argentina
      "10",
      "",
      "",
      "1",
    ],
    [
      "What is the capital of France?",
      "London",
      "Paris",
      "Berlin",
      "Madrid",
      "1", // 0-based index, so 1 = Paris
      "10",
      "https://example.com/paris.jpg",
      "",
      "1",
    ],
    [
      "True or False: The Earth is flat",
      "True",
      "False",
      "",
      "",
      "1", // 0-based index, so 1 = False
      "8",
      "",
      "https://example.com/whistle.mp3",
      "1",
    ],
  ];

  const csv = Papa.unparse({
    fields: headers,
    data: exampleRows,
  });

  return csv;
}
