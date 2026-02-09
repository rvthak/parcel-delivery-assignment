import { Request, Response } from 'express';
import pool from '../db/pool';

export async function resetSystem(_req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query('DELETE FROM parcels');
    res.json({
      success: true,
      deleted_count: result.rowCount,
    });
  } catch (error) {
    console.error('Error resetting system:', error);
    res.status(500).json({ error: 'Failed to reset system' });
  }
}
