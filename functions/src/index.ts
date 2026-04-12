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
setGlobalOptions({ maxInstances: 2 });

export const extractDataFromMoodleQuizResults = onRequest(
  (request, response) => {
    // Only allow POST requests for CSV uploads
    if (request.method !== "POST") {
      response.status(405).send("Method Not Allowed");
      return;
    }

    const busboy = busboyFactory({ headers: request.headers });
    const results: Record<string, string>[] = [];
    let fileProcessed = false;

    busboy.on("file", (fieldname, file, info) => {
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
          columns: true, // Uses the first row as header keys
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
        response.status(500).send("Error parsing CSV");
      });

      parser.on("end", () => {
        logger.info(`Finished parsing ${results.length} records`);
      });
    });

    busboy.on("finish", () => {
      if (!fileProcessed) {
        response.status(400).send("No CSV file found in request");
        return;
      }
      // Send the resulting JavaScript object back as JSON
      response.status(200).json({
        success: true,
        count: results.length,
        data: results,
      });
    });

    busboy.on("error", (err) => {
      logger.error("Busboy error:", err);
      response.status(500).send("Internal Server Error");
    });

    // Pipe the request into busboy
    if (request.rawBody) {
      busboy.end(request.rawBody);
    } else {
      request.pipe(busboy);
    }
  },
);
