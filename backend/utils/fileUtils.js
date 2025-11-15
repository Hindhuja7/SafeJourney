import fs from "fs/promises";

/**
 * Read JSON file
 * @param {string} filePath - Path to JSON file
 * @returns {Promise<any>} Parsed JSON data
 */
export async function readJSON(filePath) {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    if (err.code === "ENOENT") {
      // File doesn't exist, return empty array for data files
      return [];
    }
    throw err;
  }
}

/**
 * Write JSON file
 * @param {string} filePath - Path to JSON file
 * @param {any} data - Data to write
 */
export async function writeJSON(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

