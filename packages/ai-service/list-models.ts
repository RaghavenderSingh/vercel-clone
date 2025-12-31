import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_AI_API_KEY;

if (!apiKey) {
  console.error('Please set GOOGLE_AI_API_KEY');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    const data: any = await response.json();

    if (!response.ok) {
      console.error('Error:', data);
      process.exit(1);
    }

    console.log('Available Gemini models:\n');

    data.models
      .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
      .forEach((model: any) => {
        console.log(`- ${model.name.replace('models/', '')}`);
        console.log(`  Display Name: ${model.displayName}`);
        console.log(`  Description: ${model.description}`);
        console.log('');
      });
  } catch (error) {
    console.error('Failed to list models:', error);
  }
}

listModels();
