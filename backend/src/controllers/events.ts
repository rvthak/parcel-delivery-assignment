import { Request, Response } from 'express';
import pool from '../db/pool';
import { DriverStats } from '../types';

// Store active SSE connections per driver
const driverConnections = new Map<number, Set<Response>>();

async function getDriverStats(driverId: number): Promise<DriverStats> {
  const result = await pool.query(
    `SELECT
       COUNT(*)::int AS assigned_count,
       COUNT(scanned_at)::int AS scanned_count
     FROM parcels
     WHERE driver_id = $1`,
    [driverId]
  );

  return {
    driver_id: driverId,
    assigned_count: result.rows[0].assigned_count,
    scanned_count: result.rows[0].scanned_count,
  };
}

function sendSSE(res: Response, data: DriverStats): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export async function streamDriverStats(req: Request, res: Response): Promise<void> {
  const driverId = parseInt(req.params.driver_id, 10);

  if (isNaN(driverId)) {
    res.status(400).json({ error: 'Invalid driver ID' });
    return;
  }

  // Check if driver exists
  const driverCheck = await pool.query('SELECT id FROM drivers WHERE id = $1', [driverId]);
  if (driverCheck.rows.length === 0) {
    res.status(404).json({ error: 'Driver not found' });
    return;
  }

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Send initial stats
  const initialStats = await getDriverStats(driverId);
  sendSSE(res, initialStats);

  // Register this connection
  if (!driverConnections.has(driverId)) {
    driverConnections.set(driverId, new Set());
  }
  driverConnections.get(driverId)!.add(res);

  // Heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  // Cleanup on disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    const connections = driverConnections.get(driverId);
    if (connections) {
      connections.delete(res);
      if (connections.size === 0) {
        driverConnections.delete(driverId);
      }
    }
  });
}

export async function notifyDriverUpdate(driverId: number): Promise<void> {
  const connections = driverConnections.get(driverId);
  if (!connections || connections.size === 0) return;

  try {
    const stats = await getDriverStats(driverId);
    for (const res of connections) {
      sendSSE(res, stats);
    }
  } catch (error) {
    console.error(`Error sending SSE update for driver ${driverId}:`, error);
  }
}
