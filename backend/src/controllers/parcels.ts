import { Request, Response } from 'express';
import pool from '../db/pool';
import { CreateParcelRequest } from '../types';
import { notifyDriverUpdate } from './events';

const PG_UNIQUE_VIOLATION = '23505';

export async function createParcel(req: Request, res: Response): Promise<void> {
  const { voucher_id, postcode } = req.body as CreateParcelRequest;

  if (!voucher_id || !postcode) {
    res.status(400).json({ error: 'voucher_id and postcode are required' });
    return;
  }

  const prefix = postcode.substring(0, 2);

  try {
    // Find a driver for this postcode prefix
    const driverResult = await pool.query(
      `SELECT d.id, d.name FROM drivers d
       JOIN clusters c ON d.cluster_id = c.id
       WHERE c.postcode_prefix = $1
       LIMIT 1`,
      [prefix]
    );

    if (driverResult.rows.length === 0) {
      res.status(400).json({ error: `No driver available for postcode prefix '${prefix}'` });
      return;
    }

    const driver = driverResult.rows[0];

    // Insert the parcel
    await pool.query(
      'INSERT INTO parcels (voucher_id, postcode, driver_id) VALUES ($1, $2, $3)',
      [voucher_id, postcode, driver.id]
    );

    // Notify SSE listeners for this driver
    notifyDriverUpdate(driver.id);

    res.status(201).json({
      assigned_driver: {
        id: driver.id,
        name: driver.name,
      },
    });
  } catch (error: any) {
    if (error.code === PG_UNIQUE_VIOLATION) {
      res.status(400).json({ error: 'Voucher ID already exists' });
      return;
    }
    console.error('Error creating parcel:', error);
    res.status(500).json({ error: 'Failed to create parcel' });
  }
}
