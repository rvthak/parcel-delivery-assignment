import { Request, Response } from 'express';
import pool from '../db/pool';

export async function getPostcodes(_req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query('SELECT postcode_prefix FROM clusters ORDER BY postcode_prefix');
    const prefixes = result.rows.map((row: { postcode_prefix: string }) => row.postcode_prefix);
    res.json(prefixes);
  } catch (error) {
    console.error('Error fetching postcode prefixes:', error);
    res.status(500).json({ error: 'Failed to fetch postcode prefixes' });
  }
}
