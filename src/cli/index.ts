import { Command } from 'commander';
import { reviewCommand } from './commands/review.js';
import { initCommand } from './commands/init.js';
import { rulesCommand } from './commands/rules.js';

const program = new Command()
  .name('par-lint')
  .description('Deterministic code pattern validation for Angular/Ionic/TS/SCSS')
  .version('0.1.0');

program.addCommand(reviewCommand);
program.addCommand(initCommand);
program.addCommand(rulesCommand);

program.parse();
