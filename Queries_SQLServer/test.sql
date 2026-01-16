USE F1GarageManager;
GO

UPDATE PART 
SET Name = CONCAT(
    CASE Category
        WHEN 'Power_Unit' THEN 'Power Unit '
        WHEN 'Aerodynamics_pkg' THEN 'Aerodynamics Package '
        WHEN 'Wheels' THEN 'Wheels Set '
        WHEN 'Suspension' THEN 'Suspension System '
        WHEN 'Gearbox' THEN 'Gearbox '
    END,
    Part_id
);
GO
