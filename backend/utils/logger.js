/**
 * 日志工具
 * 提供统一的日志输出接口
 */

const fs = require('fs');
const path = require('path');

// 确保 logs 目录存在
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const LOG_LEVEL = process.env.VITE_LOG_LEVEL || 'info';
const CURRENT_LEVEL = LOG_LEVELS[LOG_LEVEL.toUpperCase()] || LOG_LEVELS.INFO;

const formatTime = () => {
  const now = new Date();
  return now.toISOString();
};

const formatLog = (level, message, data = null) => {
  const time = formatTime();
  const logEntry = `[${time}] [${level}] ${message}`;

  if (data) {
    return `${logEntry} ${JSON.stringify(data)}`;
  }
  return logEntry;
};

const writeToFile = (level, message, data = null) => {
  try {
    const logFile = path.join(logsDir, 'backend.log');
    const logEntry = formatLog(level, message, data);
    fs.appendFileSync(logFile, logEntry + '\n');
  } catch (error) {
    // 如果写入失败，至少输出到 console
    console.error('Failed to write to log file:', error.message);
  }
};

const logger = {
  debug: (message, data = null) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.DEBUG) {
      const logEntry = formatLog('DEBUG', message, data);
      console.log(logEntry);
      writeToFile('DEBUG', message, data);
    }
  },

  info: (message, data = null) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.INFO) {
      const logEntry = formatLog('INFO', message, data);
      console.log(logEntry);
      writeToFile('INFO', message, data);
    }
  },

  warn: (message, data = null) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.WARN) {
      const logEntry = formatLog('WARN', message, data);
      console.warn(logEntry);
      writeToFile('WARN', message, data);
    }
  },

  error: (message, data = null) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.ERROR) {
      const logEntry = formatLog('ERROR', message, data);
      console.error(logEntry);
      writeToFile('ERROR', message, data);
    }
  },
};

module.exports = logger;
