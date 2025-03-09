#!/bin/bash

# Create base project directory
cd frontend

# Create main source folder
mkdir -p src

# Create component directories
mkdir -p src/components
mkdir -p src/components/alarms
mkdir -p src/components/layout
mkdir -p src/components/sites

# Create context directories
mkdir -p src/context

# Create hooks directory
mkdir -p src/hooks

# Create API directories
mkdir -p src/api

# Create pages directory
mkdir -p src/pages

# Create utils directory
mkdir -p src/utils

# Create main files
touch src/index.js
touch src/App.jsx

# Create API files
touch src/api/axios.js
touch src/api/services.js

# Create components
touch src/components/alarms/AlarmStatusChart.jsx
touch src/components/alarms/AlarmTable.jsx

touch src/components/layout/MainLayout.jsx
touch src/components/layout/Navbar.jsx
touch src/components/layout/Sidebar.jsx

touch src/components/sites/SiteCard.jsx
touch src/components/sites/EquipmentStatusList.jsx
touch src/components/sites/BoxStatusList.jsx

# Create context files
touch src/context/AuthContext.jsx
touch src/context/SocketContext.jsx

# Create hooks
touch src/hooks/useAlarms.js
touch src/hooks/useSites.js

# Create page components
touch src/pages/Dashboard.jsx
touch src/pages/Monitoring.jsx
touch src/pages/SiteDetail.jsx
touch src/pages/Statistics.jsx
touch src/pages/Configuration.jsx
touch src/pages/Historique.jsx
touch src/pages/Cartes.jsx
touch src/pages/Login.jsx
touch src/pages/Profile.jsx
touch src/pages/NotFound.jsx
touch src/pages/Unauthorized.jsx

# Create utils
touch src/utils/permissions.js

echo " project structure created successfully!"
