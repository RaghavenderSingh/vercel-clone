import { createAIService } from './src/index';

/**
 * Test script for AI Service
 * Tests both Claude and Gemini providers
 */

async function testProvider(providerName: 'claude' | 'gemini') {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Testing ${providerName.toUpperCase()} Provider`);
  console.log('='.repeat(50));

  try {
    const ai = createAIService(providerName);
    console.log(`✓ Provider initialized: ${ai.getProviderName()}`);
    console.log(`✓ Model: ${ai.getModelName()}\n`);

    // Test 1: Simple completion
    console.log('Test 1: Simple Completion');
    console.log('Prompt: "Say hello in one sentence"');
    const response = await ai.completion({
      prompt: 'Say hello in one sentence',
      systemPrompt: 'You are a helpful assistant.',
      temperature: 0.7,
      maxTokens: 100,
    });
    console.log(`Response: ${response.content}`);
    console.log(`Tokens: ${response.tokens?.input || 'N/A'} in, ${response.tokens?.output || 'N/A'} out\n`);

    // Test 2: Streaming
    console.log('Test 2: Streaming Completion');
    console.log('Prompt: "Count from 1 to 5"');
    process.stdout.write('Response: ');
    for await (const chunk of ai.streamCompletion({
      prompt: 'Count from 1 to 5, just the numbers separated by commas',
      systemPrompt: 'You are a helpful assistant.',
      temperature: 0.5,
      maxTokens: 50,
    })) {
      process.stdout.write(chunk);
    }
    console.log('\n');

    // Test 3: Build Error Analysis
    console.log('Test 3: Build Error Analysis');
    const errorMessage = `
Error: Module not found: Can't resolve 'react-dom'
    at resolve (/app/node_modules/webpack/lib/Compilation.js:123)
    `;
    const fixes = await ai.analyzeBuildError(errorMessage, {
      deploymentId: 'test-123',
      projectId: 'project-456',
      framework: 'nextjs',
      buildCommand: 'npm run build',
    });
    console.log(`Found ${fixes.length} fix suggestion(s):`);
    fixes.forEach((fix, i) => {
      console.log(`  ${i + 1}. ${fix.title} (confidence: ${(fix.confidence * 100).toFixed(0)}%)`);
      console.log(`     ${fix.description.slice(0, 100)}...`);
    });
    console.log('');

    console.log(`✅ ${providerName.toUpperCase()} provider: ALL TESTS PASSED\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${providerName.toUpperCase()} provider failed:`, error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function main() {
  console.log('\n🧪 AI Service Provider Tests\n');

  // Check environment variables
  const hasClaudeKey = !!process.env.ANTHROPIC_API_KEY;
  const hasGeminiKey = !!process.env.GOOGLE_AI_API_KEY;

  console.log('Environment Check:');
  console.log(`  ANTHROPIC_API_KEY: ${hasClaudeKey ? '✓ Set' : '✗ Not set'}`);
  console.log(`  GOOGLE_AI_API_KEY: ${hasGeminiKey ? '✓ Set' : '✗ Not set'}`);
  console.log(`  AI_PROVIDER: ${process.env.AI_PROVIDER || 'claude (default)'}\n`);

  if (!hasClaudeKey && !hasGeminiKey) {
    console.error('❌ ERROR: No API keys found!');
    console.error('\nPlease set at least one API key:');
    console.error('  export ANTHROPIC_API_KEY="sk-ant-xxxxx"');
    console.error('  export GOOGLE_AI_API_KEY="AIzaSyXXXXX"\n');
    process.exit(1);
  }

  const results = {
    claude: false,
    gemini: false,
  };

  // Test Claude if API key is available
  if (hasClaudeKey) {
    results.claude = await testProvider('claude');
  } else {
    console.log('\n⏭️  Skipping Claude tests (no API key)\n');
  }

  // Test Gemini if API key is available
  if (hasGeminiKey) {
    results.gemini = await testProvider('gemini');
  } else {
    console.log('\n⏭️  Skipping Gemini tests (no API key)\n');
  }

  // Summary
  console.log('='.repeat(50));
  console.log('TEST SUMMARY');
  console.log('='.repeat(50));
  if (hasClaudeKey) {
    console.log(`Claude:  ${results.claude ? '✅ PASSED' : '❌ FAILED'}`);
  }
  if (hasGeminiKey) {
    console.log(`Gemini:  ${results.gemini ? '✅ PASSED' : '❌ FAILED'}`);
  }
  console.log('='.repeat(50) + '\n');

  const allPassed = (hasClaudeKey ? results.claude : true) && (hasGeminiKey ? results.gemini : true);
  process.exit(allPassed ? 0 : 1);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
