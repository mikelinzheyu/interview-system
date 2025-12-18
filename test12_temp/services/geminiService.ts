import { GoogleGenAI } from "@google/genai";
import { MistakeItem } from "../types";

export const analyzeMistake = async (item: MistakeItem): Promise<string> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    // Return a mock response if no key is present to demonstrate UI functionality
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(`### 🧠 AI 智能诊断：${item.type}\n\n针对 **${item.question}** 的回答存在不足，建议从以下三个维度进行强化：\n\n1.  **核心概念复习**\n    *   建议重新梳理 **${item.tags[0] || '基础概念'}** 的官方文档定义。\n    *   重点关注其底层实现原理。\n\n2.  **优化建议**\n    *   尝试使用 "STAR 法则" (Situation, Task, Action, Result) 重构你的回答逻辑。\n    *   多举具体的代码实例来佐证你的观点。\n\n3.  **实践方向**\n    *   手写一个简易的 Demo 来验证原理。`);
        }, 1200);
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert technical mentor. Analyze this mistake card from a software engineer's interview review.
      
      Question: "${item.question}"
      Mistake Type: "${item.type}"
      Tags: "${item.tags.join(', ')}"
      Previous Answer Context (Snippet): "${item.snippet}"

      Provide a structured, encouraging, and actionable study plan in Chinese (Markdown format). 
      Include:
      1. **Diagnosis**: Why this mistake likely happened.
      2. **Key Concepts**: What specific technical points need review.
      3. **Action Item**: A concrete step (coding exercise or concept to read) to fix it.
      
      Keep it concise (under 200 words).`
    });

    return response.text || "无法生成分析结果，请稍后再试。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "分析服务暂时不可用，请检查网络或 API Key 配置。";
  }
};