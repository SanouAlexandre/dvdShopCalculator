import * as readline from 'node:readline';
import { Calculator } from './core/calculator';
import { CartParser } from './infrastructure/parsers/CartParser';
import { PriceFormatter } from './infrastructure/formatters/PriceFormatter';
import { logger } from './utils/logger';

/**
 * Main entry point for the DVD Shop Calculator CLI
 */
async function main(): Promise<void> {
  const parser = new CartParser();
  const calculator = new Calculator();
  const formatter = new PriceFormatter();

  // Check if input is from pipe/file
  if (!process.stdin.isTTY) {
    await handlePipedInput(parser, calculator, formatter);
    return;
  }

  // Interactive mode
  await handleInteractiveMode(parser, calculator, formatter);
}

/**
 * Handles piped input (from file or echo)
 */
async function handlePipedInput(
  parser: CartParser,
  calculator: Calculator,
  formatter: PriceFormatter
): Promise<void> {
  const chunks: string[] = [];

  process.stdin.setEncoding('utf8');

  for await (const chunk of process.stdin) {
    chunks.push(chunk as string);
  }

  const input = chunks.join('');
  processInput(input, parser, calculator, formatter);
}

/**
 * Handles interactive mode
 */
async function handleInteractiveMode(
  parser: CartParser,
  calculator: Calculator,
  formatter: PriceFormatter
): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('═══════════════════════════════════════');
  console.log('    DVD Shop Calculator 🎬');
  console.log('═══════════════════════════════════════');
  console.log('');
  console.log('Enter movie titles (one per line).');
  console.log('Type "done" when finished, or "quit" to exit.');
  console.log('');

  const lines: string[] = [];

  const prompt = (): void => {
    rl.question('> ', answer => {
      const trimmed = answer.trim().toLowerCase();

      if (trimmed === 'quit' || trimmed === 'exit') {
        console.log('\nGoodbye! 👋');
        rl.close();
        return;
      }

      if (trimmed === 'done') {
        if (lines.length === 0) {
          console.log('\nNo items in cart. Add some movies first!\n');
          prompt();
          return;
        }

        const input = lines.join('\n');
        processInput(input, parser, calculator, formatter);
        lines.length = 0; // Clear for next calculation
        console.log('\nEnter more movies or type "quit" to exit.\n');
        prompt();
        return;
      }

      if (trimmed === 'clear') {
        lines.length = 0;
        console.log('\nCart cleared.\n');
        prompt();
        return;
      }

      if (trimmed === 'list') {
        if (lines.length === 0) {
          console.log('\nCart is empty.\n');
        } else {
          console.log('\nCurrent cart:');
          lines.forEach((line, i) => console.log(`  ${i + 1}. ${line}`));
          console.log('');
        }
        prompt();
        return;
      }

      if (answer.trim()) {
        lines.push(answer.trim());
        console.log(`  ✓ Added: ${answer.trim()}`);
      }

      prompt();
    });
  };

  prompt();
}

/**
 * Processes input and displays result
 */
function processInput(
  input: string,
  parser: CartParser,
  calculator: Calculator,
  formatter: PriceFormatter
): void {
  try {
    // Validate input
    const errors = parser.validate(input);
    if (errors.length > 0) {
      console.error('\nValidation errors:');
      errors.forEach(err => console.error(`  - ${err}`));
      return;
    }

    // Parse and calculate
    const cart = parser.parse(input);

    if (cart.items.length === 0) {
      console.log('\nNo items in cart.');
      return;
    }

    const result = calculator.calculate(cart);

    // Display result
    console.log('');
    console.log(formatter.formatResult(result));
  } catch (error) {
    logger.error('Error processing cart:', error);
    console.error('\nAn error occurred while processing your cart.');
  }
}

// Run the application
// NOSONAR: Top-level await not supported with CommonJS module system
main().catch(error => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
