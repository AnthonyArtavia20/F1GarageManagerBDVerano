# F1 Garage Manager

## Project Structure
```
F1GarageManager/
├── Backend/
│   ├── src/
│   │   ├── app.js              # Main server
│   │   ├── config/              # Database config
│   │   ├── controllers/        # Business logic
│   │   ├── routes/             # API endpoints
│   │   └── middleware/         # CORS, auth, etc.
│   ├── .env                    # Environment variables
│   └── package.json
└── Frontend/
    ├── src/
    │   ├── modules/            # Page components
    │   ├── components/         # Reusable UI
    │   └── App.jsx             # Main app
    ├── .env                    # Frontend env
    └── package.json
```

## Setup
Both the `Backend` and `Frontend` must be run in different terminals.

### Backend
```
# Navigate to backend folder
cd Backend

# Install dependencies
npm install

# Configure environment variables
# Copy .env.example to .env and update with your values
cp .env.example .env

# Start server in development mode
npm run dev
```

### Frontend
```
# In a new terminal, navigate to frontend folder
cd Frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
## Data Traffic Example

### Basic Endpoint Creation 
```
// 1. Create controller function
exports.newFunction = async (req, res) => { /* logic */ };

// 2. Add to routes
router.get('/new-endpoint', controller.newFunction);

// 3. Call from frontend
fetch('/api/route/new-endpoint');
```
### Detailed Example

#### 1. Frontend Layer
**Location:** `Frontend/src/modules/[web-page].jsx`
```
// Example API call from frontend
const [function] = async () => {
  const response = await fetch("http://localhost:9090/[API route + endpoint]");
  const data = await response.json();
  console.log(data);
};
```

#### 2. Backend Layer (Node.js + Express)
**a) Main Server (`Backend/src/app.js`)**
```
const express = require('express');
const app = express();

// Import Route
const [route name] = require('./routes/[specific route]');

// Middleware
app.use(express.json());  // Parse JSON requests
app.use(cors());          // Allow frontend connections

// Routes Usage
app.use('[API route]', [route name]);  // Connect routes

// Init Server...
```

**b) Routes (`Backend/src/routes/[specific route].js`)**
```
const express = require('express');
const router = express.Router();
const [import controller] = require('../controllers/[controller to be use]');

// Define endpoints
router.get('[endpoint]', [import controller].[controller function]);
router.post('[endpoint]',[import controller].[controller function]);

module.exports = router;
```

**c) Controllers (`Backend/src/controllers/[specific controller].js`)**
```
const { mssqlConnect, sql } = require('../config/database');

// Function to be export for the controller
exports.[controller function] = async (req, res) => {
  try {
    // Connect to database
    const pool = await mssqlConnect();
    
    // Execute SQL query
    const result = await pool.request().query([SQL query -without GO-]);
    
    /** Alternative for Stored Procedures:
    * const result = await request.execute(procedureName);
    */

    // Send JSON response to frontend
    res.json({
      success: true,
      message: 'Database connected',
      data: result.recordset
    });
  } catch (error) {
    // Handle errors
    res.status(500).json({
      success: false,
      message: 'Connection failed',
      error: error.message
    });
  }
};
```
**d) Database Configuration (`Backend/src/config/database.js`)**

Already setup for initialize connection with mssql-server, assuming the `.env` is properly configured.
