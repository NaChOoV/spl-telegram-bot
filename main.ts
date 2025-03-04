import CronJobService from './src/services/cron.service';
import { telegramService } from './src/services/telegram.service';
// SETUP
telegramService.launch();

const cronjobService = new CronJobService();
await cronjobService.setup();
