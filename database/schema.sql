-- Clusters Table
CREATE TABLE clusters (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(10) NOT NULL UNIQUE,
    postcode_prefix VARCHAR(2) NOT NULL UNIQUE
);

-- Drivers Table
CREATE TABLE drivers (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    cluster_id INT NOT NULL REFERENCES clusters(id) ON DELETE RESTRICT
);

-- Parcels Table
CREATE TABLE parcels (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    voucher_id VARCHAR(50) NOT NULL UNIQUE,
    postcode VARCHAR(5) NOT NULL,
    driver_id INT NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
    scanned_at TIMESTAMP DEFAULT NULL
);

-- Indexes
CREATE INDEX idx_drivers_cluster_id ON drivers(cluster_id);
CREATE INDEX idx_parcels_driver_id ON parcels(driver_id);
CREATE INDEX idx_parcels_scanned_at ON parcels(scanned_at);
