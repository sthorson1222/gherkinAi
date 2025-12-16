import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

const getAiClient = () => {
  // Safely check for API key in various environment configurations (Node, Vite, etc.)
  let apiKey = '';
  try {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      apiKey = process.env.API_KEY;
    } else if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
      apiKey = import.meta.env.VITE_API_KEY;
    }
  } catch (e) {
    console.warn("Error accessing environment variables:", e);
  }

  if (!apiKey) {
    throw new Error("API_KEY is not set. Please configure it in your environment (e.g., .env file).");
  }
  return new GoogleGenAI({ apiKey });
};

interface GenerateParams {
  userStory: string;
  context?: string;
  imageBase64?: string;
  mimeType?: string;
  useFastMode?: boolean;
  mockupUrl?: string;
  deepCoverage?: boolean;
}

// --- Function Calling Definitions ---

const runTestTool: FunctionDeclaration = {
  name: "runTestExecution",
  description: "Executes the TestRunner for a given scenario and returns simulated test output, including Gherkin step statuses and console logs.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      scenario: {
        type: Type.STRING,
        description: "Name or description of the test scenario to execute (e.g. 'LIMS Microsoft Login Flow', 'Manage Bill Briefs')."
      },
      tags: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING
        },
        description: "Optional list of tags or labels that further qualify which tests to execute (e.g. ['@smoke', '@login'])."
      },
      dryRun: {
        type: Type.BOOLEAN,
        description: "If true, only returns a high-level simulation/preview instead of a full execution."
      }
    },
    required: ["scenario"]
  }
};

export const parseTestCommand = async (userPrompt: string) => {
  try {
    const ai = getAiClient();
    const model = 'gemini-2.5-flash';

    const systemPrompt = `
You are an AI assistant embedded in a test automation console for a QA engineer.
The user has a tool/function named runTestExecution that connects to a real TestRunner (TypeScript / Playwright / Dockerized environment) for executing or simulating tests.

Your responsibilities:

When the user wants to “run”, “execute”, “start”, “re-run”, or “trigger” tests, you should:
1. Call the tool runTestExecution instead of just describing what would happen.
2. Pass the requested scenario name as the scenario parameter.
3. Optionally pass tags if the user mentions tags (e.g. @smoke, @login), or dryRun: true if the user says they want a preview.

Always prefer calling runTestExecution over simulating or hallucinating a run when the user explicitly asks to:
- “run the tests”
- “execute this scenario”
- “run the login flow”
- “run the LIMS test”
- “execute TestRunner”

After the tool returns:
- Summarize the result in natural language.
- Show a structured view of: Scenario name, Step list (Gherkin steps with status), Console Logs.
- If the test failed, highlight failing steps and error messages.

When NOT to call the tool:
- If the user is only asking conceptual questions (e.g. “How does the TestRunner work?”, “Explain what the login flow does”), you can answer directly without calling runTestExecution.
- If the user is editing or designing Gherkin or architecture, treat it as a design conversation, not an execution request.

Mapping language → tool calls:
- If the user says: “Run the LIMS Microsoft Login Flow”, call: runTestExecution({ "scenario": "LIMS Microsoft Login Flow" })
- If the user says: “Run the smoke tests for login”, call: runTestExecution({ "scenario": "Login", "tags": ["@smoke"] })
- If the user says: “Show me a dry run of the manage bill briefs scenario”, call: runTestExecution({ "scenario": "Manage Bill Briefs", "dryRun": true })

Output style:
- Be concise but clear.
- Use sections like: Scenario, Step Results, Console Logs.
- Do not invent logs that contradict the tool output.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        tools: [{ functionDeclarations: [runTestTool] }],
      }
    });

    // Check for tool calls
    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      if (call.name === 'runTestExecution') {
         return {
           kind: 'TOOL_CALL',
           toolName: 'runTestExecution',
           args: call.args as { scenario: string, tags?: string[], dryRun?: boolean }
         };
      }
    }

    // Default to text response if no tool call
    return {
      kind: 'TEXT',
      text: response.text || "I didn't understand the test command. Could you specify which scenario to run?"
    };

  } catch (error) {
    console.error("Gemini Command Error:", error);
    return {
      kind: 'ERROR',
      text: "Failed to process command."
    };
  }
};

export const generateGherkin = async ({ userStory, context, imageBase64, mimeType, useFastMode, mockupUrl, deepCoverage }: GenerateParams): Promise<{ feature: string, steps: string }> => {
  try {
    const ai = getAiClient();
    
    // Model Selection Logic
    // 1. If image is present OR Deep Coverage is requested, use the high-capability model.
    // 2. If fast mode is enabled (and no image/deep coverage), use the lite model.
    // 3. Default to standard flash model.
    let model = 'gemini-2.5-flash';
    if (imageBase64 || deepCoverage) {
      model = 'gemini-3-pro-preview'; 
    } else if (useFastMode) {
      model = 'gemini-2.5-flash-lite';
    }

    const separator = "|||SECTION_SEPARATOR|||";

    const coverageInstruction = deepCoverage 
      ? `CRITICAL: You are running in DEEP COVERAGE MODE. 
         - Analyze the requirement recursively to identify ALL possible edge cases.
         - You MUST include:
           1. Happy Path scenarios.
           2. Negative Testing scenarios (invalid inputs, error states).
           3. Boundary Value Analysis scenarios.
           4. Security/Access Control scenarios (if applicable).
         - Ensure the test suite is exhaustive.` 
      : `Ensure the scenarios cover the main success flow and at least one failure/error path.`;

    const systemPrompt = `
      You are an expert QA Automation Engineer specializing in Behavior Driven Development (BDD) using Cucumber and Playwright.
      Your task is to convert User Stories and Acceptance Criteria into:
      1. A valid Gherkin .feature file.
      2. The corresponding TypeScript step definitions using @cucumber/cucumber and Playwright, following the Page Object Model (POM) design pattern.
      
      Rules:
      1. Use standard Gherkin keywords: Feature, Background, Scenario, Given, When, Then, And, But.
      2. Ensure scenarios are atomic and independent.
      3. For the TypeScript code:
         - ORGANIZE output with clear comments simulating a file structure:
           // ============================================================
           // 📁 tests/pages/[PageName].ts
           // ============================================================
         - Define Page Object classes (e.g., class LoginPage { ... }) explicitly.
         - encapsulate selectors and actions within these classes.
         - Use 'import { Given, When, Then } from "@cucumber/cucumber";' at the start of the steps file.
         - Assume a 'page' object is available via 'this.page' (standard Playwright-Cucumber world).
         - Instantiate Page Objects inside the steps.
      4. Write robust selectors (e.g., page.getByRole, page.fill).
      5. SEPARATE the .feature content and the .ts content with this exact string: "${separator}"
      6. Output format: 
         [Feature File Content]
         ${separator}
         [TypeScript Steps Content]
      7. Do not include markdown code blocks (like \`\`\`) in the output.
      ${imageBase64 ? '8. Analyze the provided UI image/mockup to infer exact element selectors, layout logic, and user flow for the test scenarios.' : ''}
      
      ${coverageInstruction}
    `;

    const userPrompt = `
      User Story / Acceptance Criteria:
      ${userStory}

      ${context ? `Additional Technical Context: ${context}` : ''}
      ${mockupUrl ? `Reference Design/Mockup Link: ${mockupUrl}` : ''}
      
      Generate the Feature file and Step Definitions (with Page Object Model) now.
    `;

    let response;

    const generationConfig = {
        systemInstruction: systemPrompt,
        temperature: deepCoverage ? 0.4 : 0.2,
    };

    if (imageBase64 && mimeType) {
      const imagePart = {
        inlineData: {
          mimeType: mimeType,
          data: imageBase64
        }
      };
      const textPart = { text: userPrompt };
      
      response = await ai.models.generateContent({
        model: model,
        contents: { parts: [imagePart, textPart] },
        config: generationConfig
      });
    } else {
      response = await ai.models.generateContent({
        model: model,
        contents: userPrompt,
        config: generationConfig
      });
    }

    const fullText = response.text || "";
    const parts = fullText.split(separator);

    if (parts.length < 2) {
        return {
            feature: fullText,
            steps: "// No step definitions generated or format error."
        };
    }

    return {
        feature: parts[0].trim(),
        steps: parts[1].trim()
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
        feature: `# Error: Failed to connect to AI Service.\n# ${(error as Error).message}`,
        steps: `// Error generating steps`
    };
  }
};