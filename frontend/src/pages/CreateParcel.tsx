import React, { useState, useEffect, FormEvent } from 'react';
import { fetchPostcodes, createParcel } from '../services/api';
import { Banner } from '../components/Banner';

export const CreateParcel: React.FC = () => {
  const [voucherId, setVoucherId] = useState('');
  const [postcode, setPostcode] = useState('');
  const [validPrefixes, setValidPrefixes] = useState<string[]>([]);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchPostcodes()
      .then(setValidPrefixes)
      .catch(() => setBanner({ type: 'error', message: 'Failed to load postcode prefixes' }));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBanner(null);

    if (!voucherId.trim() || !postcode.trim()) {
      setBanner({ type: 'error', message: 'Both fields are required' });
      return;
    }

    if (!/^\d{5}$/.test(postcode)) {
      setBanner({ type: 'error', message: 'Postcode must be exactly 5 digits' });
      return;
    }

    const prefix = postcode.substring(0, 2);
    if (!validPrefixes.includes(prefix)) {
      setBanner({
        type: 'error',
        message: `Postcode prefix not supported. Valid prefixes: ${validPrefixes.join(', ')}`,
      });
      return;
    }

    try {
      const data = await createParcel(voucherId.trim(), postcode.trim());
      setBanner({
        type: 'success',
        message: `Parcel created successfully! Assigned to driver: ${data.assigned_driver.name}`,
      });
      setVoucherId('');
      setPostcode('');
    } catch (err: any) {
      setBanner({ type: 'error', message: err.error || 'Failed to create parcel' });
    }
  };

  return (
    <div>
      <h1 className="page-title">Create Parcel</h1>
      {banner && <Banner type={banner.type} message={banner.message} onClose={() => setBanner(null)} />}
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="voucher-id" className="form-label">Voucher ID</label>
          <input
            id="voucher-id"
            type="text"
            value={voucherId}
            onChange={(e) => setVoucherId(e.target.value)}
            className="form-input"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="postcode" className="form-label">Postcode</label>
          <input
            id="postcode"
            type="text"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            className="form-input"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Create Parcel
        </button>
      </form>
    </div>
  );
};
