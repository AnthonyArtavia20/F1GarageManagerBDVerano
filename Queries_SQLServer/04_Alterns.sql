-- ============================================================================
-- F1 Garage Manager - Base de Datos Verano CE3101
-- Alterns / Alters 
-- Grupo 3/C, Alexs, Anthony, Bryan, Felipe
-- ============================================================================

USE F1GarageManager;
GO

PRINT 'Agregando Foreign Keys (ALTER TABLE)...';
GO

-- *¨*¨*¨*¨*¨*¨*¨*¨*¨*¨*
-- ENGINEER FKs
PRINT 'Agregando FKs a ENGINEER...';
GO

ALTER TABLE ENGINEER
ADD CONSTRAINT FK_Engineer_User FOREIGN KEY (User_id)
REFERENCES [USER](User_id);
GO

ALTER TABLE ENGINEER
ADD CONSTRAINT FK_Engineer_Team FOREIGN KEY (Team_id)
REFERENCES TEAM(Team_id);
GO

PRINT 'FKs de ENGINEER listas';
GO


-- *¨*¨*¨*¨*¨*¨*¨*¨*¨*¨*
-- DRIVER FKs
PRINT 'Agregando FKs a DRIVER...';
GO

ALTER TABLE DRIVER
ADD CONSTRAINT FK_Driver_User FOREIGN KEY (User_id)
REFERENCES [USER](User_id);
GO

ALTER TABLE DRIVER
ADD CONSTRAINT FK_Driver_Team FOREIGN KEY (Team_id)
REFERENCES TEAM(Team_id);
GO

PRINT 'FKs de DRIVER listas';
GO


-- *¨*¨*¨*¨*¨*¨*¨*¨*¨*¨*
-- ADMIN FKs
PRINT 'Agregando FKs a ADMIN...';
GO

ALTER TABLE ADMIN
ADD CONSTRAINT FK_Admin_User FOREIGN KEY (User_id)
REFERENCES [USER](User_id);
GO

PRINT 'FKs de ADMIN listas';
GO


-- *¨*¨*¨*¨*¨*¨*¨*¨*¨*¨*
-- INVENTROY FKs (ojo: en tu script 02 la tabla está como INVENTROY)
PRINT 'Agregando FKs a INVENTROY...';
GO

ALTER TABLE INVENTROY
ADD CONSTRAINT FK_Inventory_Team FOREIGN KEY (Team_id)
REFERENCES TEAM(Team_id);
GO

PRINT 'FKs de INVENTROY listas';
GO


-- *¨*¨*¨*¨*¨*¨*¨*¨*¨*¨*
-- CAR FKs
PRINT 'Agregando FKs a CAR...';
GO

ALTER TABLE CAR
ADD CONSTRAINT FK_Car_Team FOREIGN KEY (Team_id)
REFERENCES TEAM(Team_id);
GO

PRINT 'FKs de CAR listas';
GO


-- *¨*¨*¨*¨*¨*¨*¨*¨*¨*¨*
-- SIMULATION FKs
PRINT 'Agregando FKs a SIMULATION...';
GO

ALTER TABLE SIMULATION
ADD CONSTRAINT FK_Simulation_Circuit FOREIGN KEY (Circuit_id)
REFERENCES CIRCUIT(Circuit_id);
GO

ALTER TABLE SIMULATION
ADD CONSTRAINT FK_Simulation_Car FOREIGN KEY (Car_id)
REFERENCES CAR(Car_id);
GO

ALTER TABLE SIMULATION
ADD CONSTRAINT FK_Simulation_Driver FOREIGN KEY (Driver_User_id)
REFERENCES DRIVER(User_id);
GO

ALTER TABLE SIMULATION
ADD CONSTRAINT FK_Simulation_Team FOREIGN KEY (Team_id)
REFERENCES TEAM(Team_id);
GO

PRINT 'FKs de SIMULATION listas';
GO


-- *¨*¨*¨*¨*¨*¨*¨*¨*¨*¨*
-- CONTRIBUTION FKs
PRINT 'Agregando FKs a CONTRIBUTION...';
GO

ALTER TABLE CONTRIBUTION
ADD CONSTRAINT FK_Contribution_Sponsor FOREIGN KEY (Sponsor_id)
REFERENCES SPONSOR(Sponsor_id);
GO

ALTER TABLE CONTRIBUTION
ADD CONSTRAINT FK_Contribution_Team FOREIGN KEY (Team_id)
REFERENCES TEAM(Team_id);
GO

PRINT 'FKs de CONTRIBUTION listas';
GO


-- *¨*¨*¨*¨*¨*¨*¨*¨*¨*¨*
-- PURCHASE FKs
PRINT 'Agregando FKs a PURCHASE...';
GO

ALTER TABLE PURCHASE
ADD CONSTRAINT FK_Purchase_Engineer FOREIGN KEY (Engineer_User_id)
REFERENCES ENGINEER(User_id);
GO

ALTER TABLE PURCHASE
ADD CONSTRAINT FK_Purchase_Part FOREIGN KEY (Part_id)
REFERENCES PART(Part_id);
GO

PRINT 'FKs de PURCHASE listas';
GO


-- *¨*¨*¨*¨*¨*¨*¨*¨*¨*¨*
-- INVENTORY_PART FKs (FK hacia INVENTROY según tu repo)
PRINT 'Agregando FKs a INVENTORY_PART...';
GO

ALTER TABLE INVENTORY_PART
ADD CONSTRAINT FK_InventoryPart_Inventory FOREIGN KEY (Inventory_id)
REFERENCES INVENTROY(Inventory_id);
GO

ALTER TABLE INVENTORY_PART
ADD CONSTRAINT FK_InventoryPart_Part FOREIGN KEY (Part_id)
REFERENCES PART(Part_id);
GO

PRINT 'FKs de INVENTORY_PART listas';
GO


-- *¨*¨*¨*¨*¨*¨*¨*¨*¨*¨*
-- CAR_CONFIGURATION FKs
PRINT 'Agregando FKs a CAR_CONFIGURATION...';
GO

ALTER TABLE CAR_CONFIGURATION
ADD CONSTRAINT FK_CarConfig_Car FOREIGN KEY (Car_id)
REFERENCES CAR(Car_id);
GO

ALTER TABLE CAR_CONFIGURATION
ADD CONSTRAINT FK_CarConfig_Part FOREIGN KEY (Part_id)
REFERENCES PART(Part_id);
GO

PRINT 'FKs de CAR_CONFIGURATION listas';
GO


PRINT 'Todas las Foreign Keys (ALTER TABLE) fueron agregadas exitosamente';
GO
