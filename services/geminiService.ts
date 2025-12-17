// import { GoogleGenAI } from "@google/genai";
// import { Issue } from "../types";

// // NOTE: In a real app, API_KEY comes from process.env.API_KEY.
// // The code below assumes process.env.API_KEY is available.
// // The component using this must ensure the key exists or handle the error gracefully.

// export const generateIssueAnalysis = async (issue: Issue): Promise<string> => {
//   if (!process.env.API_KEY) {
//     console.warn("Gemini API Key missing");
//     return "AI analysis unavailable (Missing API Key).";
//   }

//   try {
//     const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
//     const prompt = `
//       Analyze the following civic issue report. 
//       Title: ${issue.title}
//       Description: ${issue.description}
//       Category: ${issue.category}
//       City: ${issue.city}
      
//       Please provide a concise summary (max 2 sentences) and a suggested priority level (Low, Medium, High, Critical) based on the description.
//       Format: "Priority: [Level] - [Summary]"
//     `;

//     const response = await ai.models.generateContent({
//       model: 'gemini-2.5-flash',
//       contents: prompt,
//     });

//     return response.text || "Could not generate analysis.";
//   } catch (error) {
//     console.error("Gemini Error:", error);
//     return "Error generating AI analysis.";
//   }
// };
