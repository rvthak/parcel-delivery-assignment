-- Insert predefined clusters
INSERT INTO clusters (name, postcode_prefix) VALUES
    ('A', '10'),
    ('B', '11'),
    ('C', '16');

-- Insert predefined drivers
INSERT INTO drivers (name, cluster_id) VALUES
    ('Moe', (SELECT id FROM clusters WHERE name = 'A')),
    ('Larry', (SELECT id FROM clusters WHERE name = 'B')),
    ('Curly', (SELECT id FROM clusters WHERE name = 'C'));
