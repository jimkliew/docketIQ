/**
 * Audit Trail System for DocketIQ
 * Comprehensive logging of all agent activities and data transformations
 */

class AuditLogger {
  constructor() {
    this.logs = [];
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
  }

  generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log an agent action
   */
  logAgentAction(agentId, action, data = {}) {
    const entry = {
      id: this.generateLogId(),
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      timestampMs: Date.now(),
      type: "agent-action",
      agentId,
      action,
      data,
      stackDepth: this.getStackDepth(),
    };
    this.logs.push(entry);
    return entry.id;
  }

  /**
   * Log agent input
   */
  logInput(agentId, inputData) {
    const entry = {
      id: this.generateLogId(),
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      timestampMs: Date.now(),
      type: "input",
      agentId,
      data: this.sanitizeData(inputData),
      dataSize: JSON.stringify(inputData).length,
    };
    this.logs.push(entry);
    return entry.id;
  }

  /**
   * Log agent output
   */
  logOutput(agentId, outputData, inputLogId = null) {
    const entry = {
      id: this.generateLogId(),
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      timestampMs: Date.now(),
      type: "output",
      agentId,
      data: this.sanitizeData(outputData),
      dataSize: JSON.stringify(outputData).length,
      inputLogId,
    };
    this.logs.push(entry);
    return entry.id;
  }

  /**
   * Log an error
   */
  logError(agentId, error, context = {}) {
    const entry = {
      id: this.generateLogId(),
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      timestampMs: Date.now(),
      type: "error",
      agentId,
      error: {
        message: error.message || String(error),
        stack: error.stack,
        name: error.name,
      },
      context,
    };
    this.logs.push(entry);
    return entry.id;
  }

  /**
   * Log API request
   */
  logAPIRequest(agentId, url, method = "GET", headers = {}) {
    const entry = {
      id: this.generateLogId(),
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      timestampMs: Date.now(),
      type: "api-request",
      agentId,
      url,
      method,
      headers: this.sanitizeHeaders(headers),
    };
    this.logs.push(entry);
    return entry.id;
  }

  /**
   * Log API response
   */
  logAPIResponse(agentId, requestLogId, status, data, duration) {
    const entry = {
      id: this.generateLogId(),
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      timestampMs: Date.now(),
      type: "api-response",
      agentId,
      requestLogId,
      status,
      data: this.sanitizeData(data),
      dataSize: JSON.stringify(data).length,
      durationMs: duration,
    };
    this.logs.push(entry);
    return entry.id;
  }

  /**
   * Log data transformation
   */
  logTransformation(agentId, operation, inputSample, outputSample) {
    const entry = {
      id: this.generateLogId(),
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      timestampMs: Date.now(),
      type: "transformation",
      agentId,
      operation,
      inputSample: this.sanitizeData(inputSample),
      outputSample: this.sanitizeData(outputSample),
    };
    this.logs.push(entry);
    return entry.id;
  }

  /**
   * Log metric calculation
   */
  logMetric(agentId, metricName, value, calculation) {
    const entry = {
      id: this.generateLogId(),
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      timestampMs: Date.now(),
      type: "metric",
      agentId,
      metricName,
      value,
      calculation,
    };
    this.logs.push(entry);
    return entry.id;
  }

  generateLogId() {
    return `log-${Date.now()}-${this.logs.length}-${Math.random().toString(36).substr(2, 6)}`;
  }

  getStackDepth() {
    const stack = new Error().stack;
    return stack ? stack.split("\n").length : 0;
  }

  sanitizeData(data) {
    // Prevent logging sensitive data and limit size
    if (!data) return null;

    const str = JSON.stringify(data);
    if (str.length > 10000) {
      // Truncate large data
      return {
        _truncated: true,
        preview: str.substring(0, 1000) + "...",
        size: str.length,
      };
    }

    // Remove potential API keys
    const sanitized = JSON.parse(str);
    if (sanitized && typeof sanitized === "object") {
      delete sanitized.apiKey;
      delete sanitized.api_key;
      delete sanitized.openAiApiKey;
    }

    return sanitized;
  }

  sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    delete sanitized.Authorization;
    delete sanitized["X-Api-Key"];
    return sanitized;
  }

  /**
   * Get logs for a specific agent
   */
  getLogsByAgent(agentId) {
    return this.logs.filter((log) => log.agentId === agentId);
  }

  /**
   * Get logs by type
   */
  getLogsByType(type) {
    return this.logs.filter((log) => log.type === type);
  }

  /**
   * Get logs in time range
   */
  getLogsByTimeRange(startMs, endMs) {
    return this.logs.filter(
      (log) => log.timestampMs >= startMs && log.timestampMs <= endMs
    );
  }

  /**
   * Get agent execution timeline
   */
  getAgentTimeline(agentId) {
    const agentLogs = this.getLogsByAgent(agentId);
    const timeline = [];

    for (let i = 0; i < agentLogs.length; i++) {
      const log = agentLogs[i];
      const nextLog = agentLogs[i + 1];
      const duration = nextLog
        ? nextLog.timestampMs - log.timestampMs
        : null;

      timeline.push({
        ...log,
        duration,
      });
    }

    return timeline;
  }

  /**
   * Get execution summary
   */
  getSummary() {
    const agentCounts = {};
    const typeCounts = {};
    const errors = [];

    this.logs.forEach((log) => {
      agentCounts[log.agentId] = (agentCounts[log.agentId] || 0) + 1;
      typeCounts[log.type] = (typeCounts[log.type] || 0) + 1;

      if (log.type === "error") {
        errors.push(log);
      }
    });

    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.startTime,
      totalLogs: this.logs.length,
      agentCounts,
      typeCounts,
      errors,
      firstLog: this.logs[0],
      lastLog: this.logs[this.logs.length - 1],
    };
  }

  /**
   * Export logs as JSON
   */
  export() {
    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      exportTime: Date.now(),
      logs: this.logs,
      summary: this.getSummary(),
    };
  }

  /**
   * Export logs as CSV
   */
  exportCSV() {
    const headers = [
      "id",
      "timestamp",
      "type",
      "agentId",
      "action",
      "dataSize",
      "error",
    ];

    const rows = this.logs.map((log) => [
      log.id,
      log.timestamp,
      log.type,
      log.agentId,
      log.action || "",
      log.dataSize || "",
      log.error?.message || "",
    ]);

    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  }

  /**
   * Clear all logs
   */
  clear() {
    this.logs = [];
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
  }
}

// Global audit logger instance
export const auditLogger = new AuditLogger();

/**
 * Wrap agent execution with audit logging
 */
export function auditAgent(agentId, fn) {
  return async function auditedFunction(...args) {
    const inputLogId = auditLogger.logInput(agentId, args);
    const startTime = Date.now();

    try {
      auditLogger.logAgentAction(agentId, "started", {
        inputLogId,
      });

      const result = await fn(...args);
      const duration = Date.now() - startTime;

      auditLogger.logOutput(agentId, result, inputLogId);
      auditLogger.logAgentAction(agentId, "completed", {
        inputLogId,
        duration,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      auditLogger.logError(agentId, error, {
        inputLogId,
        duration,
      });
      auditLogger.logAgentAction(agentId, "failed", {
        inputLogId,
        duration,
        error: error.message,
      });

      throw error;
    }
  };
}

/**
 * Create an audited API fetch function
 */
export function createAuditedFetch(agentId) {
  return async function auditedFetch(url, options = {}) {
    const requestLogId = auditLogger.logAPIRequest(
      agentId,
      url,
      options.method || "GET",
      options.headers || {}
    );

    const startTime = Date.now();

    try {
      const response = await fetch(url, options);
      const duration = Date.now() - startTime;

      const data = await response.json();

      auditLogger.logAPIResponse(
        agentId,
        requestLogId,
        response.status,
        data,
        duration
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      auditLogger.logAPIResponse(
        agentId,
        requestLogId,
        0,
        { error: error.message },
        duration
      );
      throw error;
    }
  };
}
