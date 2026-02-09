import { Router } from 'express';
import { getPostcodes } from '../controllers/postcodes';
import { createParcel } from '../controllers/parcels';
import { getDrivers } from '../controllers/drivers';
import { streamDriverStats } from '../controllers/events';
import { scanParcel } from '../controllers/scan';
import { resetSystem } from '../controllers/reset';

const router = Router();

router.get('/postcodes', getPostcodes);
router.post('/parcels', createParcel);
router.get('/drivers', getDrivers);
router.get('/events/drivers/:driver_id/stats', streamDriverStats);
router.post('/scan', scanParcel);
router.post('/reset', resetSystem);

export default router;
