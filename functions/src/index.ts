/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from "firebase-functions";
import { onRequest } from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import busboyFactory from "busboy";
import { parse } from "csv-parse";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ region: "asia-southeast1", maxInstances: 2 });

export const extractDataFromMoodleQuizResults = onRequest(
  { cors: true, invoker: "public" },
  (request, response) => {
    // only allow POST requests for CSV uploads
    if (request.method !== "POST") {
      response.status(405).send("Method Not Allowed");
      return;
    }

    const busboy = busboyFactory({ headers: request.headers });
    const results: Record<string, string>[] = [];
    let fileProcessed = false;

    busboy.on("file", (fieldname, file, info) => {
      if (fieldname !== "quiz_results") {
        response.status(400).send("Invalid field name");
        return;
      }

      const { filename, mimeType } = info;
      logger.info(`Processing file: ${filename} (${mimeType})`);

      if (mimeType !== "text/csv" && !filename.endsWith(".csv")) {
        logger.warn(`Skipping non-CSV file: ${filename}`);
        file.resume();
        return;
      }

      fileProcessed = true;
      const parser = file.pipe(
        parse({
          bom: true, // detect and strip the UTF-8 BOM
          columns: true, // uses the first row as header keys
          skip_empty_lines: true,
          trim: true,
        }),
      );

      parser.on("readable", () => {
        let record;
        while ((record = parser.read()) !== null) {
          results.push(record);
        }
      });

      parser.on("error", (err) => {
        logger.error("Error parsing CSV:", err);
        if (!response.headersSent) {
          response.status(500).send("Error parsing CSV");
        }
      });

      parser.on("end", () => {
        logger.info(`Finished parsing ${results.length} records`);
      });
    });

    busboy.on("finish", () => {
      if (response.headersSent) {
        return;
      }

      if (!fileProcessed) {
        response.status(400).send("No CSV file found in request");
        return;
      }

      // pop the last 2 records
      results.pop();
      const groupAverage = results.pop();

      // get the first field name that starts with "Grade/"
      const gradeFieldName = Object.keys(groupAverage || {}).find((key) =>
        key.startsWith("Grade/"),
      );
      const groupAverageValue = groupAverage?.[gradeFieldName || ""];

      // get the max grade from the group average field name. Usually the field name is like "Grade/100"
      const parts = gradeFieldName?.split("/") || [];
      const maxGrade = parseInt(parts.length == 2 ? parts[1] : "0");
      const passingScore = maxGrade * 0.7;

      // sort the results by the grade field name in descending order. Then filter the top scorers
      results.sort((a, b) => {
        const aGrade = parseFloat(a[gradeFieldName || ""] || "0");
        const bGrade = parseFloat(b[gradeFieldName || ""] || "0");
        return bGrade - aGrade;
      });
      const highestScore = parseInt(results[0][gradeFieldName || ""] || "0");
      const topScorers = results
        .filter((result) => {
          const grade = parseInt(result[gradeFieldName || ""] || "0");
          return grade >= highestScore;
        })
        .map((result) => result["First name"] + " " + result["Last name"])
        .sort();

      // count the number of passed
      const passedCount = results.filter((result) => {
        const grade = parseInt(result[gradeFieldName || ""] || "0");
        return grade >= passingScore;
      }).length;
      const failedCount = results.length - passedCount;

      // filter the result who have empty grades
      const noAttempts = results.filter((result) => {
        const grade = result[gradeFieldName || ""];
        const gradeNumber = parseInt(grade);

        // return true if NaN
        return Number.isNaN(gradeNumber);
      }).length;

      // send the resulting JavaScript object back as JSON
      response.status(200).json({
        groupAverage: parseFloat(groupAverageValue || "0"),
        maximumPoints: maxGrade,
        passingScore: passingScore,
        totalAttempts: results.length,
        noAttempts: noAttempts,
        highestScore: highestScore,
        topScorers: topScorers,
        passedCount: passedCount,
        failedCount: failedCount,
      });
    });

    busboy.on("error", (err) => {
      logger.error("Busboy error:", err);
      if (!response.headersSent) {
        response.status(500).send("Internal Server Error");
      }
    });

    // pipe the request into busboy
    if (request.rawBody) {
      busboy.end(request.rawBody);
      return;
    }

    request.pipe(busboy);
  },
);
