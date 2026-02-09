import { Request, Response } from 'express';
import pool from '../db/pool';

export async function getDrivers(_req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query('SELECT id, name FROM drivers ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
}
