
import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is not set.");
  }
  return new GoogleGenAI({ apiKey });
};

interface GenerateParams {
  userStory: string;
  context?: string;
  imageBase64?: string;
  mimeType?: string;
  useFastMode?: boolean;
}

export const generateGherkin = async ({ userStory, context, imageBase64, mimeType, useFastMode }: GenerateParams): Promise<{ feature: string, steps: string }> => {
  try {
    const ai = getAiClient();
    
    // Model Selection Logic
    // 1. If image is present, use the high-capability multimodal model.
    // 2. If fast mode is enabled (and no image), use the lite model.
    // 3. Default to standard flash model.
    let model = 'gemini-2.5-flash';
    if (imageBase64) {
      model = 'gemini-3-pro-preview'; 
    } else if (useFastMode) {
      model = 'gemini-2.5-flash-lite';
    }

    const separator = "|||SECTION_SEPARATOR|||";

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
    `;

    const userPrompt = `
      User Story / Acceptance Criteria:
      ${userStory}

      ${context ? `Additional Technical Context: ${context}` : ''}
      
      Generate the Feature file and Step Definitions (with Page Object Model) now.
    `;

    let response;

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
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.2,
        }
      });
    } else {
      response = await ai.models.generateContent({
        model: model,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.2,
        }
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
