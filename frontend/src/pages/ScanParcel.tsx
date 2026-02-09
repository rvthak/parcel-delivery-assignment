import React, { useState, FormEvent } from 'react';
import { scanParcel } from '../services/api';
import { Banner } from '../components/Banner';

export const ScanParcel: React.FC = () => {
  const [voucherId, setVoucherId] = useState('');
  const [banner, setBanner] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBanner(null);

    if (!voucherId.trim()) {
      setBanner({ type: 'error', message: 'Voucher ID is required' });
      return;
    }

    try {
      await scanParcel(voucherId.trim());
      setBanner({ type: 'success', message: 'Parcel scanned successfully!' });
      setVoucherId('');
    } catch (err: any) {
      if (err.status === 404) {
        setBanner({ type: 'error', message: 'Voucher ID not found' });
      } else if (err.status === 400) {
        setBanner({ type: 'warning', message: 'Parcel already scanned' });
      } else {
        setBanner({ type: 'error', message: err.error || 'Failed to scan parcel' });
      }
    }
  };

  return (
    <div>
      <h1 className="page-title">Scan Parcel</h1>
      {banner && <Banner type={banner.type} message={banner.message} onClose={() => setBanner(null)} />}
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="scan-voucher-id" className="form-label">Voucher ID</label>
          <input
            id="scan-voucher-id"
            type="text"
            value={voucherId}
            onChange={(e) => setVoucherId(e.target.value)}
            className="form-input"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Scan Parcel
        </button>
      </form>
    </div>
  );
};
