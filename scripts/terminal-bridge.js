/**
 * Sentio Tactical Terminal Bridge
 * ──────────────────────────────
 * Run this on your PC to trigger instant in-app events from terminal keystrokes!
 *
 * Usage:
 *   node scripts/terminal-bridge.js
 */

const WebSocket = require('ws');
const readline = require('readline');

const PORT = 8989;
const wss = new WebSocket.Server({ port: PORT });

console.clear();
console.log('\x1b[36m%s\x1b[0m', '==================================================');
console.log('\x1b[33m%s\x1b[0m', '       SENTIO HUD // TACTICAL TERMINAL BRIDGE      ');
console.log('\x1b[36m%s\x1b[0m', '==================================================');
console.log(`[SERVER] WebSocket server listening on port \x1b[32m${PORT}\x1b[0m`);
console.log('[STATUS] Waiting for mobile device link...');

// Configure terminal key interception
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}

let activeClient = null;

wss.on('connection', (ws) => {
  activeClient = ws;
  console.log('\n\x1b[32m%s\x1b[0m', '>>> DEVICE LINKED SUCCESSFULLY <<<');
  printMenu();

  ws.on('close', () => {
    activeClient = null;
    console.log('\n\x1b[31m%s\x1b[0m', '>>> DEVICE DISCONNECTED <<<');
    console.log('[STATUS] Waiting for mobile device reconnect...');
  });
});

function printMenu() {
  console.log('\n\x1b[35m%s\x1b[0m', '--- HOTKEY TRIGGERS ---');
  console.log(' \x1b[1m[C]\x1b[0m Trigger SOS / Crash Countdown');
  console.log(' \x1b[1m[H]\x1b[0m Report Random Mock Hazard');
  console.log(' \x1b[1m[E]\x1b[0m Spam Boost Emoji (⚡)');
  console.log(' \x1b[1m[S]\x1b[0m Speed Boost (+20 km/h)');
  console.log(' \x1b[1m[R]\x1b[0m Reset Telemetry');
  console.log(' \x1b[1m[Q]\x1b[0m Exit Bridge');
  console.log('\x1b[90m%s\x1b[0m', 'Press any listed key to execute...');
}

process.stdin.on('keypress', (str, key) => {
  if (key.ctrl && key.name === 'c') {
    process.exit();
  }

  if (key.name === 'q') {
    console.log('\n[BRIDGE] Shutting down.');
    process.exit();
  }

  if (!activeClient) {
    console.log('\x1b[31m%s\x1b[0m', '\n[WARN] No device currently linked. Waiting for connection...');
    return;
  }

  const action = key.name ? key.name.toLowerCase() : '';

  switch (action) {
    case 'c':
      console.log('\x1b[31m%s\x1b[0m', '\n[COMMAND] Sent: SOS_TRIGGER');
      activeClient.send(JSON.stringify({ type: 'SOS_TRIGGER' }));
      break;
    case 'h':
      console.log('\x1b[33m%s\x1b[0m', '\n[COMMAND] Sent: MOCK_HAZARD');
      activeClient.send(JSON.stringify({ type: 'MOCK_HAZARD' }));
      break;
    case 'e':
      console.log('\x1b[35m%s\x1b[0m', '\n[COMMAND] Sent: EMOJI_SPAM');
      activeClient.send(JSON.stringify({ type: 'EMOJI_SPAM', emoji: '⚡' }));
      break;
    case 's':
      console.log('\x1b[32m%s\x1b[0m', '\n[COMMAND] Sent: SPEED_BOOST');
      activeClient.send(JSON.stringify({ type: 'SPEED_BOOST' }));
      break;
    case 'r':
      console.log('\x1b[36m%s\x1b[0m', '\n[COMMAND] Sent: RESET_TELEMETRY');
      activeClient.send(JSON.stringify({ type: 'RESET_TELEMETRY' }));
      break;
  }
});
