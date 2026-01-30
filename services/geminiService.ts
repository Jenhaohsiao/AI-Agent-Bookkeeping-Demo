import { GoogleGenAI, Type, FunctionDeclaration, Tool, Content } from "@google/genai";
import { db } from './dbService';
import { TransactionType } from '../types';

// Define Function Declarations (Tools)
const addTransactionTool: FunctionDeclaration = {
  name: "addTransaction",
  description: "Add a new financial transaction (income or expense) to the ledger.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      date: { type: Type.STRING, description: "Date in YYYY-MM-DD format." },
      type: { type: Type.STRING, description: "Type of transaction: 'income' or 'expense'." },
      category: { type: Type.STRING, description: "Category of the transaction (e.g., Food, Salary, Utilities)." },
      amount: { type: Type.NUMBER, description: "Amount of money." },
      description: { type: Type.STRING, description: "Short description of the transaction." },
    },
    required: ["date", "type", "category", "amount"],
  },
};

const queryTransactionsTool: FunctionDeclaration = {
  name: "queryTransactions",
  description: "Search/Query transactions from the ledger based on filters.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      dateStart: { type: Type.STRING, description: "Start date (YYYY-MM-DD)." },
      dateEnd: { type: Type.STRING, description: "End date (YYYY-MM-DD)." },
      type: { type: Type.STRING, description: "Filter by 'income' or 'expense'." },
      category: { type: Type.STRING, description: "Filter by category name." },
    },
  },
};

const deleteTransactionTool: FunctionDeclaration = {
  name: "deleteTransaction",
  description: "Delete a transaction by its ID.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "The ID of the transaction to delete." },
    },
    required: ["id"],
  },
};

const tools: Tool[] = [
  {
    functionDeclarations: [addTransactionTool, queryTransactionsTool, deleteTransactionTool],
  },
];

// Generate current date string for system instruction
const getTodayString = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const systemInstruction = `
You are an intelligent financial assistant integrated into a Ledger App.
You have direct access to the database via tools.

**CRITICAL - Today's Date:**
Today is ${getTodayString()}. When the user says "today" (今天), use this date.
When the user says "yesterday" (昨天), use the day before this date.
When the user says "this month" (這個月), it refers to ${getTodayString().substring(0, 7)}.

**Language Rules:**
- If the user writes in Chinese (either Traditional or Simplified), ALWAYS respond in Traditional Chinese (繁體中文).
- If the user writes in English, respond in English.
- When in doubt about the language, default to Traditional Chinese.

**CRITICAL - Validation Rules (MUST FOLLOW):**
Before calling 'addTransaction', you MUST have ALL of the following information:
1. **Date**: When did this happen? (If user says "today"/"yesterday", you know it. Otherwise ASK.)
2. **Type**: Is it income (收入) or expense (支出)? (Usually inferable from context, e.g., "花了" = expense, "賺了" = income)
3. **Category**: What category? Valid categories are: Food, Transport, Utilities, Salary, Entertainment, Shopping, Healthcare, Other.
   - "午餐/早餐/晚餐/吃飯" → Food
   - "打車/公車/捷運/加油" → Transport  
   - "水電/電話費/網路" → Utilities
   - "薪水/獎金" → Salary
   - "電影/遊戲/KTV" → Entertainment
   - "買衣服/購物" → Shopping
   - "看醫生/買藥" → Healthcare
   - If the user does NOT specify or imply a category, you MUST ASK: "請問這筆是什麼類型的支出？（例如：餐飲、交通、購物等）"
4. **Amount**: How much money? (REQUIRED - if missing, ASK.)

**DO NOT use 'Uncategorized' or make up a category. Always ask the user if unclear.**

**Functional Rules:**
- When a user asks to record something with complete info (e.g., "今天午餐花了150元"), call 'addTransaction'.
- When info is INCOMPLETE (e.g., "今天花了150元" without saying what for), ASK for the missing category before calling the tool.
- When a user asks for a report or query, call 'queryTransactions', analyze the data, and summarize it.
- When asked to delete, query first if needed to find the ID, or delete if ID is provided.
- Be concise and helpful. Format monetary values clearly.
- Use $ for currency display unless the user specifies otherwise.
`;

export class GeminiAgent {
  private ai: GoogleGenAI;
  private chatSession: any;

  constructor() {
    // NOTE: This assumes process.env.API_KEY is available.
    // In a real deployed app, you'd handle this via a backend proxy or user input if client-side.
    // For this demo structure, we assume the environment is set up or key is passed.
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async startChat() {
    this.chatSession = this.ai.chats.create({
      model: "gemini-2.0-flash",
      config: {
        systemInstruction: systemInstruction,
        tools: tools,
      },
    });
  }

  async sendMessage(message: string): Promise<string> {
    if (!this.chatSession) await this.startChat();

    // 1. Send user message
    let result = await this.chatSession.sendMessage({ message });
    
    // 2. Loop to handle function calls
    while (result.functionCalls && result.functionCalls.length > 0) {
      const parts: any[] = [];

      for (const call of result.functionCalls) {
        console.log("Tool Call:", call.name, call.args);
        let apiResponse: any = { error: "Unknown tool" };

        try {
          if (call.name === "addTransaction") {
            const args = call.args as any;
            apiResponse = await db.add({
                date: args.date,
                type: args.type as TransactionType,
                category: args.category,
                amount: Number(args.amount),
                description: args.description || ""
            });
            // Emit event to notify UI about the new transaction
            window.dispatchEvent(new CustomEvent('ai-transaction-added', { 
              detail: { date: args.date, id: apiResponse.id, type: 'add' } 
            }));
          } else if (call.name === "queryTransactions") {
            apiResponse = await db.query(call.args as any);
          } else if (call.name === "deleteTransaction") {
            const args = call.args as any;
            const success = await db.delete(args.id);
            apiResponse = { success, message: success ? "Deleted" : "ID not found" };
            if (success) {
              window.dispatchEvent(new CustomEvent('ai-transaction-deleted', { 
                detail: { id: args.id, type: 'delete' } 
              }));
            }
          }
        } catch (e: any) {
          apiResponse = { error: e.message };
        }

        // Build function response part
        parts.push({
          functionResponse: {
            id: call.id,
            name: call.name,
            response: apiResponse,
          }
        });
      }

      // 3. Send function responses back to model
      result = await this.chatSession.sendMessage({ message: parts });
    }

    // 4. Return final text
    return result.text || "我已處理完成，但沒有文字回應。";
  }
}

export const geminiAgent = new GeminiAgent();