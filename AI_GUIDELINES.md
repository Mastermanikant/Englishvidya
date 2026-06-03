# English Vidya - AI Agent Guidelines
**CRITICAL INSTRUCTIONS FOR ALL AI ASSISTANTS WORKING ON THIS PROJECT**

This project contains massive JSON dictionaries (e.g., ~20,000 words, ~4.5MB). To prevent excessive token consumption and context window overflow, you MUST adhere to the following rules at all times:

## 1. Zero-Output Execution (Silent Processing)
- **NEVER** print the full contents of any JSON or large text file to the terminal output.
- When running node scripts to process data, strictly limit the output.
- Always use `Array.prototype.slice(0, 3)` to sample data, or just print `Array.length`.

## 2. Script-First Approach
- Do not use `view_file` or `cat` on large data files like `master_dictionary_FINAL_v6.json`.
- If you need to inspect, modify, or validate data, write a temporary Node.js script to do the processing, and ensure it only prints a summary (e.g., `console.log("Updated 500 files successfully.")`).

## 3. Workflow Efficiency
- Write scripts that write results directly to files (`fs.writeFileSync`).
- Trust the script execution. If the script logic is correct, do not ask the terminal to dump the file back to you just to "verify" it.

*Failure to follow these rules will result in burning the user's API tokens unnecessarily. Be a smart, token-efficient agent!*
