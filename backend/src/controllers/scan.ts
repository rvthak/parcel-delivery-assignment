import { Request, Response } from 'express';
import pool from '../db/pool';
import { ScanParcelRequest } from '../types';
import { notifyDriverUpdate } from './events';

export async function scanParcel(req: Request, res: Response): Promise<void> {
  const { voucher_id } = req.body as ScanParcelRequest;

  if (!voucher_id) {
    res.status(400).json({ error: 'voucher_id is required' });
    return;
  }

  try {
    // Find the parcel
    const parcelResult = await pool.query(
      'SELECT id, driver_id, scanned_at FROM parcels WHERE voucher_id = $1',
      [voucher_id]
    );

    if (parcelResult.rows.length === 0) {
      res.status(404).json({ error: 'Voucher ID not found' });
      return;
    }

    const parcel = parcelResult.rows[0];

    if (parcel.scanned_at !== null) {
      res.status(400).json({ error: 'Parcel already scanned' });
      return;
    }

    // Mark as scanned
    await pool.query(
      'UPDATE parcels SET scanned_at = NOW() WHERE id = $1',
      [parcel.id]
    );

    // Notify SSE listeners for this driver
    notifyDriverUpdate(parcel.driver_id);

    res.json({ success: true });
  } catch (error) {
    console.error('Error scanning parcel:', error);
    res.status(500).json({ error: 'Failed to scan parcel' });
  }
}
