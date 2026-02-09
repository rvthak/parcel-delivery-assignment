export interface Cluster {
  id: number;
  name: string;
  postcode_prefix: string;
}

export interface Driver {
  id: number;
  name: string;
  cluster_id: number;
}

export interface Parcel {
  id: number;
  voucher_id: string;
  postcode: string;
  driver_id: number;
  scanned_at: Date | null;
}

export interface CreateParcelRequest {
  voucher_id: string;
  postcode: string;
}

export interface ScanParcelRequest {
  voucher_id: string;
}

export interface DriverStats {
  driver_id: number;
  assigned_count: number;
  scanned_count: number;
}
