import React, { useState, useEffect, useRef } from 'react';
import { fetchDrivers, createDriverSSE } from '../services/api';

interface DriverStats {
  driver_id: number;
  assigned_count: number;
  scanned_count: number;
}

interface DriverInfo {
  id: number;
  name: string;
  stats: DriverStats | null;
}

export const LiveStatus: React.FC = () => {
  const [drivers, setDrivers] = useState<DriverInfo[]>([]);
  const eventSourcesRef = useRef<EventSource[]>([]);

  useEffect(() => {
    let mounted = true;

    fetchDrivers().then((driverList) => {
      if (!mounted) return;

      const driverInfos: DriverInfo[] = driverList.map((d) => ({
        id: d.id,
        name: d.name,
        stats: null,
      }));
      setDrivers(driverInfos);

      // Create SSE connections for each driver
      driverList.forEach((driver) => {
        const es = createDriverSSE(driver.id);
        eventSourcesRef.current.push(es);

        es.onmessage = (event) => {
          const data: DriverStats = JSON.parse(event.data);
          setDrivers((prev) =>
            prev.map((d) => (d.id === data.driver_id ? { ...d, stats: data } : d))
          );
        };
      });
    });

    return () => {
      mounted = false;
      eventSourcesRef.current.forEach((es) => es.close());
      eventSourcesRef.current = [];
    };
  }, []);

  return (
    <div>
      <h1 className="page-title">Live Status Dashboard</h1>
      <div className="card-list">
        {drivers.map((driver) => {
          const assigned = driver.stats?.assigned_count ?? 0;
          const scanned = driver.stats?.scanned_count ?? 0;
          const isReady = assigned > 0 && scanned === assigned;

          return (
            <div key={driver.id} className="card driver-card">
              <span className="driver-name">{driver.name}</span>
              <span className="driver-stat">Assigned: {assigned}</span>
              <span className="driver-stat">Scanned: {scanned}</span>
              {isReady && (
                <span className="badge badge-success">Ready to Depart</span>
              )}
            </div>
          );
        })}
        {drivers.length === 0 && <p>Loading drivers...</p>}
      </div>
    </div>
  );
};
