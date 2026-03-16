import os from "os";

/**
 * Get current CPU usage as a percentage (0-100)
 * On Windows, os.loadavg() returns [0, 0, 0], so we calculate it manually.
 */
let lastCpus = os.cpus();

export const getCpuUsage = () => {
  if (os.platform() !== "win32") {
    // On Unix systems, loadavg[0] is usually reliable/sufficient
    return parseFloat(os.loadavg()[0].toFixed(2));
  }

  // Windows calculation using os.cpus() deltas
  const currentCpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;

  for (let i = 0; i < currentCpus.length; i++) {
    const cpu = currentCpus[i];
    const prevCpu = lastCpus[i];

    // Tick deltas
    totalTick += cpu.times.user - prevCpu.times.user;
    totalTick += cpu.times.nice - prevCpu.times.nice;
    totalTick += cpu.times.sys - prevCpu.times.sys;
    totalTick += cpu.times.irq - prevCpu.times.irq;
    totalTick += cpu.times.idle - prevCpu.times.idle;

    // Idle delta
    totalIdle += cpu.times.idle - prevCpu.times.idle;
  }

  // Update last seen state
  lastCpus = currentCpus;

  if (totalTick === 0) return 0;

  // Usage = 1 - (idle / total)
  const usage = 1 - totalIdle / totalTick;
  return parseFloat((usage * 100).toFixed(2));
};

/**
 * Get system memory usage percentage
 */
export const getMemoryUsage = () => {
  const total = os.totalmem();
  const free = os.freemem();
  const usage = ((total - free) / total) * 100;
  return parseFloat(usage.toFixed(2));
};

/**
 * Get system uptime in seconds
 */
export const getUptime = () => os.uptime();
