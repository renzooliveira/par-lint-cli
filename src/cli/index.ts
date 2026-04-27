import { Command } from 'commander';
import { reviewCommand } from './commands/review.js';
import { initCommand } from './commands/init.js';
import { rulesCommand } from './commands/rules.js';
import { docsCommand } from './commands/docs.js';
import { watchCommand } from './commands/watch.js';
import { summaryCommand } from './commands/summary.js';
import { hookCommand } from './commands/hook.js';
import { diffCommand } from './commands/diff.js';
import { ciCommand } from './commands/ci.js';
import { initClaudeMdCommand } from './commands/init-claude-md.js';

const program = new Command()
  .name('par-lint')
  .description('Deterministic code pattern validation for Angular/Ionic/TS/SCSS')
  .version('0.1.0');

program.addCommand(reviewCommand);
program.addCommand(initCommand);
program.addCommand(rulesCommand);
program.addCommand(docsCommand);
program.addCommand(watchCommand);
program.addCommand(summaryCommand);
program.addCommand(hookCommand);
program.addCommand(diffCommand);
program.addCommand(ciCommand);
program.addCommand(initClaudeMdCommand);

program.parse();
