# F1 Garage Manager 🏎️

A comprehensive Formula 1 team management system built with React, Node.js, and Microsoft SQL Server. This full-stack application enables team management, car assembly, race simulations, and performance analytics through integrated dashboards.

![F1 Garage Manager CEO](./Important/CEO.jpg)

## 🎯 Project Overview

F1 Garage Manager is an academic project developed for the CE-3101 Databases course at Instituto Tecnológico de Costa Rica. The system demonstrates practical implementation of relational database concepts including conceptual and logical modeling, referential integrity, complex queries, transactions, and business rule enforcement at the database level.

### Key Features

- **User Management**: Role-based authentication (Admin, Engineer, Driver) with secure session handling
- **Team Operations**: Complete CRUD for teams, including budget tracking via sponsor contributions
- **Car Assembly**: Interactive car building with 5 mandatory part categories and real-time performance calculations
- **Inventory System**: Automatic inventory management with part tracking and stock validation
- **Race Simulations**: Formula-based race simulations with mathematical models for speed, penalties, and rankings
- **Analytics Dashboard**: Grafana integration for performance visualization and setup comparison
- **Financial Module**: Sponsor management and contribution tracking for budget calculations

## 🛠️ Tech Stack

### Frontend
- **React** 18.2.0 - UI library
- **TypeScript** 5.2.2 - Type safety
- **Vite** 5.0.0 - Build tool and dev server
- **Tailwind CSS** 3.4.0 - Utility-first CSS framework
- **shadcn/ui** - Reusable component library
- **React Router DOM** 6.21.1 - Client-side routing
- **React Hook Form** 7.49.2 - Form management

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **mssql** - SQL Server driver
- **bcrypt** - Password hashing
- **express-session** - Session management
- **cookie-parser** - Cookie handling

### Database
- **Microsoft SQL Server** - Primary database
- **Stored Procedures** - Business logic enforcement
- **Transactions** - Data consistency

### Analytics
- **Grafana** (Cloud) - Data visualization and dashboards

## 📁 Project Structure

```
F1GarageManager/
├── Backend/                              # Node.js/Express API server
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js               # SQL Server connection config
│   │   ├── controllers/                  # Business logic handlers
│   │   │   ├── authController.js         # Login/logout, session management
│   │   │   ├── circuitsController.js     # Circuit CRUD operations
│   │   │   ├── driversController.js      # Driver management
│   │   │   ├── inventoryController.js    # Team inventory tracking
│   │   │   ├── partsController.js        # Parts catalog (store)
│   │   │   ├── simulationsController.js  # Race simulation execution
│   │   │   ├── sponsorsController.js     # Sponsor & contributions
│   │   │   └── teamsController.js        # Team operations
│   │   ├── middleware/
│   │   │   ├── corsMiddleware.js         # CORS configuration
│   │   │   ├── isAdmin.js                # Admin role authorization
│   │   │   └── teamGuard.js              # Team-based access control
│   │   ├── routes/                       # API endpoint definitions
│   │   │   ├── modules/
│   │   │   │   ├── CarAssembly.js        # Car building routes
│   │   │   │   └── UserManagement.js     # User CRUD routes
│   │   │   ├── authRoutes.js             # /api/auth
│   │   │   ├── circuitsRoutes.js         # /api/circuits
│   │   │   ├── simulationsRoutes.js      # /api/simulations
│   │   │   └── [other routes...]
│   │   └── app.js                        # Express app initialization
│   ├── .env                              # Environment variables
│   └── package.json
│
├── Frontend/                             # React + TypeScript + Vite
│   ├── src/
│   │   ├── auth/
│   │   │   ├── authContext.tsx           # Auth state management
│   │   │   └── ProtectedRoute.tsx        # Route guard component
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── MainLayout.tsx        # App shell with sidebar
│   │   │   │   └── Sidebar.tsx           # Navigation menu
│   │   │   └── ui/                       # shadcn/ui components
│   │   ├── modules/                      # Main application pages
│   │   │   ├── Login.tsx                 # Authentication page
│   │   │   ├── Analytics.tsx             # Dashboard/Grafana integration
│   │   │   ├── CarAssembly.tsx           # Car building interface
│   │   │   ├── Circuits.tsx              # Circuit management
│   │   │   ├── Drivers.tsx               # Driver management
│   │   │   ├── DriverProfile.tsx         # Driver statistics view
│   │   │   ├── Inventory.tsx             # Team inventory
│   │   │   ├── Simulation.tsx            # Race simulation
│   │   │   ├── Sponsors.tsx              # Sponsor management
│   │   │   ├── Store.tsx                 # Parts catalog
│   │   │   ├── Teams.tsx                 # Team management
│   │   │   ├── UserManagement.tsx        # Admin user management
│   │   │   └── NotFound.tsx              # 404 page
│   │   ├── lib/
│   │   │   ├── api.ts                    # API fetch wrapper
│   │   │   └── utils.ts                  # Utility functions
│   │   ├── App.tsx                       # Main app component
│   │   └── main.tsx                      # React entry point
│   ├── .env                              # Frontend environment variables
│   └── package.json
│
├── Queries_SQLServer/                    # Database setup scripts (run in order)
│   ├── 01_Schema_y_Entidades_Fuertes.sql # Create DB + strong entities
│   ├── 02_Entidades_Debiles.sql          # Weak entities (roles)
│   ├── 03_Tablas_Intermedias.sql         # Junction tables (N:M)
│   ├── 04_Alterns.sql                    # Foreign key constraints
│   ├── 05-1Stored_ProceduresUserManagement.sql  # User CRUD SPs
│   ├── 05-2StoredproceduresCircuits.sql  # Circuit CRUD SPs
│   ├── 05-3StoredproceduresSimulations.sql # Simulation execution SPs
│   ├── 05_Stored_Procedures.sql          # General stored procedures
│   └── 06_SCRIPTDETESTING.sql            # Test data insertion
│
├── Grafana/                              # Data visualization
│   ├── dashboards/
│   │   ├── Admin.json                    # Admin dashboard config
│   │   ├── Driver.json                   # Driver dashboard config
│   │   └── Engineer.json                 # Engineer dashboard config
│   └── docker-compose.yml                # Grafana Docker setup
│
├── Docs/
│   └── Official_Docs.pdf                 # Complete project documentation
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **Microsoft SQL Server** (Express or higher)
- **SQL Server Management Studio** (SSMS)
- **npm** or **yarn**

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/AnthonyArtavia20/F1GarageManagerBDVerano.git
cd F1GarageManagerBDVerano
```

#### 2. Database Setup

1. **Start SQL Server** and open SQL Server Management Studio
2. **Connect to your SQL Server instance** (e.g., `DESKTOP-XXXX\SQLEXPRESS`)
3. **you can run the bash "AutoRunSQLFiles.bash" and it will delete the BD if exist and then excecute in order these files:**:
**Note!**
You need to change the credentials of SQL Server in "AutoRunSQLFiles.bash" with yours
   ```
   Queries_SQLServer/01_Schema_y_Entidades_Fuertes.sql
   Queries_SQLServer/02_Entidades_Debiles.sql
   Queries_SQLServer/03_Tablas_Intermedias.sql
   Queries_SQLServer/04_Alterns.sql
   Queries_SQLServer/05-1Stored_ProceduresUserManagement.sql
   Queries_SQLServer/05-2StoredproceduresCircuits.sql
   Queries_SQLServer/05-3StoredproceduresSimulations.sql
   Queries_SQLServer/05_Stored_Procedures.sql
   Queries_SQLServer/06_SCRIPTDETESTING.sql  (optional - adds test data)
   ```

4. **Verify** the database `F1GarageManager` was created successfully with all tables

#### 3. Backend Setup

```bash
cd Backend

# Install dependencies (first time only)
npm install

# Configure environment variables
# Create a .env file with the following:
DB_SERVER=YOUR_SERVER_NAME\SQLEXPRESS
DB_NAME=F1GarageManager
DB_USER=your_username  # (if using SQL Server authentication)
DB_PASSWORD=your_password  # (if using SQL Server authentication)
PORT=9090
SESSION_SECRET=your_session_secret_key
```

**Note**: If using Windows Authentication, you can omit `DB_USER` and `DB_PASSWORD`.

#### 4. Frontend Setup

```bash
# Open a new terminal
cd Frontend

# Install dependencies (first time only)
npm install

# Configure environment variables
# Create a .env file with:
VITE_API_URL=http://localhost:9090
```

### Running the Application

**Important**: The backend and frontend must run in separate terminals simultaneously.

#### Terminal 1: Start Backend Server

```bash
cd Backend
npm run dev
```

The backend will start on `http://localhost:9090`

#### Terminal 2: Start Frontend Development Server

```bash
cd Frontend
npm run dev
```

The frontend will start on `http://localhost:5173` (or the next available port)

### Default Test Users

After running the test data script (`06_SCRIPTDETESTING.sql`), you can use these accounts:

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Engineer | engineer1 | engineer123 |
| Driver | driver1 | driver123 |

## 🎮 Usage Guide

### User Roles

#### Admin
- Full system access
- Create/manage users, teams, drivers, sponsors, circuits
- Execute race simulations
- View Grafana analytics dashboards

#### Engineer
- Manage assigned team's budget and inventory
- Purchase parts from the store
- Assemble cars (max 2 per team)
- View team performance statistics

#### Driver
- Read-only access to personal profile
- View race participation history
- Access personal performance statistics

### Core Workflows

#### 1. Team Setup
1. Admin creates a team
2. Admin registers sponsors and records contributions (builds team budget)
3. Admin creates Engineer and Driver users, assigns them to the team

#### 2. Car Assembly
1. Engineer purchases parts from the store (validates budget and stock)
2. Parts are automatically added to team inventory
3. Engineer accesses Car Assembly module
4. Selects 5 parts (one per category: Power Unit, Aerodynamics, Wheels, Suspension, Gearbox)
5. System calculates P, A, M totals in real-time
6. Engineer finalizes the car (must have all 5 categories)

#### 3. Race Simulation
1. Admin creates a circuit (distance, number of curves)
2. Admin selects finalized cars and assigns drivers
3. System executes simulation using mathematical formulas:
   - **Straight Speed**: `V_straight = 200 + 3*P + 0.2*H - A` km/h
   - **Curve Speed**: `V_curve = 90 + 2*A + 2*M + 0.2*H` km/h
   - **Penalty**: `Penalty = (C * 40) / (1 + H/100)` seconds
   - **Total Time**: `Time = (Distance/Speed) * 3600 + Penalty` seconds
4. Results are persisted with complete setup details
5. Rankings are displayed and sent to Grafana

## 📊 Grafana Integration

### Overview
The system integrates with Grafana Cloud to provide advanced analytics and visualization of race simulation results. All simulation data, including car configurations, performance metrics, and race outcomes, are stored in the SQL Server database and can be queried by Grafana for real-time dashboard updates.

### Required Dashboards

The following Grafana panels are implemented:

1. **Ranking Panel**: Displays race results by simulation and circuit, showing final positions and times
2. **Setup Comparison Panel**: Compares the same car across different simulations with varying part configurations
3. **Performance Correlation Panel**: Visualizes the relationship between total time and P, A, M values

### Configuration

[Detailed Grafana setup instructions will be provided by team member Luis Felipe, including:
- Grafana Cloud account setup
- SQL Server data source configuration
- Dashboard JSON import process
- Panel query examples
- Embedding dashboards in the Admin view]

### Access

Grafana dashboards are accessible:
- **Embedded**: Within the Analytics module in the application
- **Direct Link**: Via Grafana Cloud URL (Admin only)

## 🏗️ Architecture

### Database Design

The system implements a normalized relational model (3NF) with 17 tables:

**Strong Entities**:
- `USER`, `TEAM`, `SPONSOR`, `PART`, `CIRCUIT`, `SIMULATION`

**Weak Entities**:
- `ENGINEER`, `DRIVER`, `ADMIN` (specialization of USER)
- `INVENTORY` (depends on TEAM)
- `CAR` (depends on TEAM)

**Junction Tables**:
- `CONTRIBUTION` (Sponsor → Team)
- `PURCHASE` (Engineer → Part)
- `INVENTORY_PART` (Inventory ↔ Part)
- `CAR_CONFIGURATION` (Car ↔ Part)
- `SIMULATION_PARTICIPANT` (Simulation ↔ Car ↔ Driver)

### API Architecture

The backend follows a layered architecture:

```
Request → Routes → Middleware → Controllers → Database → Response
```

**Key Patterns**:
- **Stored Procedures**: All complex operations use SPs for business logic enforcement
- **Transactions**: Critical operations (purchases, part installation, simulations) wrapped in transactions
- **Middleware**: Authentication, authorization, and CORS handling
- **Session Management**: Secure cookies with HttpOnly, Secure, SameSite flags

### Data Flow Example

**Purchase Flow**:
```
1. Frontend: User selects part from store
2. API: POST /api/parts/purchase
3. Middleware: Verify authentication & Engineer role
4. Controller: Call sp_PurchasePart stored procedure
5. Database Transaction:
   - Validate budget >= part price
   - Validate stock > 0
   - Deduct from team budget
   - Decrease part stock
   - Add to team inventory
   - Log purchase record
6. Response: Success/failure message
7. Frontend: Update UI and show confirmation
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt (cost factor 10)
- **Session Security**: HttpOnly cookies with SameSite=strict
- **Role-Based Access Control**: Middleware guards for each role
- **SQL Injection Prevention**: Parameterized queries and stored procedures
- **CORS Configuration**: Restricted to frontend origin
- **Environment Variables**: Sensitive credentials stored in .env files

## 🧪 Testing

The project includes test data scripts to facilitate development and demonstration:

```bash
# Run in SSMS after setting up the database schema
Queries_SQLServer/06_SCRIPTDETESTING.sql
```

This creates:
- 3 test users (admin, engineer, driver)
- 5 teams with budgets
- 10 sponsors with contributions
- 50+ parts across all categories
- 5 race circuits
- Sample car configurations

## 📝 Business Rules

### Key Constraints

1. **Users**: Each user has exactly one role (Admin, Engineer, or Driver)
2. **Teams**: Maximum 2 cars per team, one inventory per team
3. **Cars**: Must have exactly 5 parts (one per category) to be finalized
4. **Inventory**: Parts can only be installed if they exist in team inventory
5. **Budget**: Team budget = sum of all sponsor contributions
6. **Purchases**: Validated against both budget and stock availability
7. **Simulations**: Only finalized cars can participate

### Performance Calculations

**Car Stats** (0-45 range each):
```
P (Power) = p1 + p2 + p3 + p4 + p5
A (Aerodynamics) = a1 + a2 + a3 + a4 + a5
M (Handling) = m1 + m2 + m3 + m4 + m5
```

**Race Formulas**:
```
D_curves = C * dc  (dc = 0.5 km constant)
D_straights = D - D_curves
V_straight = 200 + 3*P + 0.2*H - A  (km/h)
V_curve = 90 + 2*A + 2*M + 0.2*H  (km/h)
Penalty = (C * 40) / (1 + H/100)  (seconds)
Time_hours = (D_straights/V_straight) + (D_curves/V_curve)
Time_seconds = (Time_hours * 3600) + Penalty
Winner = MIN(Time_seconds)
```

## 🤝 Contributors

**Team 3 - CE3101 Databases Course**

- **Anthony José Artavia Leitón**
  - Backend architecture, Car Assembly module, Database design, userManagement functionality
- **Alexs Eduardo Feng Wu**
  - Financial module, Sponsor management, Simulation backend
- **Luis Felipe Chaves Mena**
  - Frontend architecture, UI/UX design, Grafana integration
- **Bryan Alexander Monge Navarro**
  - Authentication system, Session management, User roles

**Course**: CE-3101 Bases de Datos  
**Institution**: Instituto Tecnológico de Costa Rica  
**Professor**: MSc. Andrés Vargas Rivera  
**Period**: December 2025 - January 2026

## 📚 Documentation

Complete project documentation including:
- Conceptual ER diagrams
- Crow's Foot logical model
- Normalization process (1NF, 2NF, 3NF)
- Database schema with constraints
- Stored procedures documentation
- API endpoint specifications
- Business rules catalog (60+ rules)

Available in: `Docs/Official_Doc.pdf`

## 🔗 Repository

**Official GitHub Repository**:  
[https://github.com/AnthonyArtavia20/F1GarageManagerBDVerano](https://github.com/AnthonyArtavia20/F1GarageManagerBDVerano)

## 📄 License

This project is developed for academic purposes as part of the CE-3101 Databases course at Instituto Tecnológico de Costa Rica.

## 🙏 Acknowledgments

- **Professor Andrés Vargas** for project guidance and technical specifications
- **shadcn/ui** for the beautiful component library
- **Tailwind CSS community** for design templates and inspiration
- **Microsoft** for SQL Server Express and comprehensive documentation
- **Grafana Labs** for the cloud analytics platform

---

**Note**: This system demonstrates academic implementation of database concepts. For production deployment, additional security hardening, scalability optimizations, and comprehensive testing would be required.