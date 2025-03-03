import AccessWebsocket from './src/http/websocket';
import { telegramService } from './src/services/telegram.service';

const accessWebsocket = new AccessWebsocket();
// SETUP
telegramService.launch();
accessWebsocket.init();
