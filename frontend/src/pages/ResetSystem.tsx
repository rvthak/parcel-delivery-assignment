import React, { useState } from 'react';
import { resetSystem } from '../services/api';
import { Banner } from '../components/Banner';

export const ResetSystem: React.FC = () => {
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleReset = async () => {
    setBanner(null);
    try {
      const data = await resetSystem();
      setBanner({
        type: 'success',
        message: `System reset successfully. ${data.deleted_count} parcels deleted.`,
      });
    } catch (err: any) {
      setBanner({ type: 'error', message: err.error || 'Failed to reset system' });
    }
  };

  return (
    <div>
      <h1 className="page-title">Reset System</h1>
      {banner && <Banner type={banner.type} message={banner.message} onClose={() => setBanner(null)} />}
      <div className="warning-box">
        <p>
          Warning: This will delete all parcels from the system. Drivers and clusters will not be affected.
        </p>
      </div>
      <button onClick={handleReset} className="btn btn-danger">
        Reset System
      </button>
    </div>
  );
};
