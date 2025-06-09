import type { Logger } from "./logger.js";
import type { MetricsService } from "./metric.js";
import type { Shutdown } from "./shutdown.js";

export type Common = {
  logger: Logger;
  metrics: MetricsService;
  shutdown: Shutdown;
};