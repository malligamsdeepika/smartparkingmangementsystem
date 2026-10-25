# Smart Parking Management System
## Multi-Device LAN & Cloud Deployment Guide
**Tested for:** Multiple Computers, Laptops, Android Phones, and Tablets on the same Wi-Fi/LAN or Public Cloud.

---

### Table of Contents
1. [Overview & Architecture](#1-overview--architecture)
2. [Prerequisites](#2-prerequisites)
3. [Finding Your Main (Host) Computer's IP Address](#3-finding-your-main-host-computers-ip-address)
4. [Running the Application on Main Computer](#4-running-the-application-on-main-computer)
5. [Starting the Java/J2EE Backend & MySQL](#5-starting-the-javaj2ee-backend--mysql)
6. [Configuring Frontend API Connection](#6-configuring-frontend-api-connection)
7. [Host Computer Firewall & Network Settings](#7-host-computer-firewall--network-settings)
8. [Connecting from Another Computer or Mobile Phone](#8-connecting-from-another-computer-or-mobile-phone)
9. [Step-by-Step Testing Checklist on Second Computer](#9-step-by-step-testing-checklist-on-second-computer)
10. [Troubleshooting Common Errors](#10-troubleshooting-common-errors)

---

### 1. Overview & Architecture

```
                  ┌────────────────────────────────────────┐
                  │          Wi-Fi / LAN Router            │
                  └──────┬──────────────────────┬──────────┘
                         │                      │
           (Host IP: 192.168.1.15)       (Client Device: 192.168.1.42)
                         │                      │
             ┌───────────▼───────────┐          │
             │   HOST COMPUTER       │          │
             │                       │          │
             │ 1. Frontend (Vite)    │          │
             │    Port: 3000         │◄─────────┼── Opens: http://192.168.1.15:3000
             │                       │          │   (Laptop / Computer 2 / Phone)
             │ 2. Backend (Java/API) │          │
             │    Port: 3000 or 8080 │◄─────────┘
             │                       │
             │ 3. MySQL Database     │
             │    Port: 3306         │
             └───────────────────────┘
```

The system includes:
- **Real-Time Availability Engine:** Uses Server-Sent Events (SSE) at `/api/events`. When Computer 1 books Slot `A-03`, Computer 2 and Mobile Phone immediately reflect the change with zero page refresh.
- **Configurable API Endpoint:** Uses `VITE_BACKEND_API_URL` with auto-fallback to relative `/api`, meaning it automatically works on any IP address without hardcoded `localhost`.
- **Cloud-Ready Database:** Supports remote MySQL URLs (`DATABASE_URL`, `MYSQL_URL`) as well as local MySQL.

---

### 2. Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 18+ (20 or 22 recommended) | Runs Frontend and Full-Stack API server |
| **Java JDK** | 17+ | For Java J2EE Servlet backend |
| **MySQL Server** | 8.0+ | Database persistence |
| **Apache Tomcat** | 10.1 (Jakarta EE 10) | Optional: To host Java backend standalone |

---

### 3. Finding Your Main (Host) Computer's IP Address

On your **main host computer** (where the project is saved):

#### On Windows:
1. Press `Win + R`, type `cmd`, and press Enter.
2. Run:
   ```cmd
   ipconfig
   ```
3. Look for your active adapter (Wi-Fi or Ethernet) and note the **IPv4 Address**:
   ```
   IPv4 Address. . . . . . . . . . . : 192.168.1.15
   ```

#### On macOS / Linux:
1. Open Terminal and run:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   # or on modern Linux:
   ip -4 addr show | grep inet
   ```
2. Note your IP address (e.g., `192.168.1.15`).

> **Note:** Throughout this guide, replace `192.168.1.15` with your computer's actual IP address.

---

### 4. Running the Application on Main Computer

#### Step 1: Open project directory
```bash
cd /path/to/SmartParkingManagementSystem
```

#### Step 2: Install dependencies (first time only)
```bash
npm install
```

#### Step 3: Start the server with host binding
```bash
npm run dev
```

The server binds to `0.0.0.0:3000`. You will see:
```
[Smart Parking Full-Stack Server] running on http://0.0.0.0:3000
[SSE Real-Time Engine] Active at /api/events
[Health Endpoint] Active at /api/health
```

Now the application is ready to accept connections from both `localhost:3000` on the main computer and `http://192.168.1.15:3000` from any other device on your network!

---

### 5. Starting the Java/J2EE Backend & MySQL

If you want to run the separate **Java Servlet Backend** on Apache Tomcat:

#### A. Prepare MySQL Database
1. Open MySQL Command Line or MySQL Workbench:
   ```sql
   -- Run database schema
   SOURCE database/schema.sql;
   
   -- Run seed data
   SOURCE database/seed_data.sql;
   ```
2. Allow MySQL connections if connecting from remote machines:
   ```sql
   CREATE USER IF NOT EXISTS 'smartpark'@'%' IDENTIFIED BY 'password123';
   GRANT ALL PRIVILEGES ON smart_parking.* TO 'smartpark'@'%';
   FLUSH PRIVILEGES;
   ```

#### B. Build the Java Backend WAR
```bash
cd backend
mvn clean package -DskipTests
```
This produces `backend/target/smartparking.war`.

#### C. Deploy to Apache Tomcat 10
1. Copy `smartparking.war` to Tomcat's `webapps/` folder:
   - On Windows: `C:\Program Files\Apache Software Foundation\Tomcat 10.1\webapps\`
   - On Linux/Mac: `/opt/tomcat/webapps/`
2. Start Tomcat (`bin/startup.bat` on Windows or `bin/startup.sh` on Linux/Mac).
3. Verify Tomcat API is reachable:
   - On main computer: `http://localhost:8080/smartparking/api/locations`
   - From another computer: `http://192.168.1.15:8080/smartparking/api/locations`

#### D. Or Run via Docker in 1 Command
```bash
cd backend
docker build -t smartparking-backend .
docker run -p 8080:8080 -e SMART_PARKING_DB_URL="jdbc:mysql://host.docker.internal:3306/smart_parking?useSSL=false&allowPublicKeyRetrieval=true" -e SMART_PARKING_DB_USER="root" -e SMART_PARKING_DB_PASS="root" smartparking-backend
```

---

### 6. Configuring Frontend API Connection

The frontend uses standard environment variables:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configuration Options in `.env`:

   **Option 1: Using the Full-Stack Server (Recommended & Default)**
   No changes needed! Leave `VITE_BACKEND_API_URL` empty or `/api`. The frontend automatically talks to the backend via relative `/api` on whatever IP or domain opens the website.

   **Option 2: Connecting directly to Tomcat on main computer**
   ```env
   VITE_BACKEND_API_URL=http://192.168.1.15:8080/smartparking/api
   ```

   **Option 3: Connecting to Cloud-Hosted Java Backend (Railway / Render)**
   ```env
   VITE_BACKEND_API_URL=https://your-java-backend.railway.app/api
   ```

---

### 7. Host Computer Firewall & Network Settings

To allow another computer to reach port `3000` (and `8080` if using Tomcat):

#### Windows Firewall:
1. Open PowerShell **as Administrator**.
2. Run these commands to allow inbound traffic on ports 3000 and 8080:
   ```powershell
   New-NetFirewallRule -DisplayName "Smart Parking Frontend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
   New-NetFirewallRule -DisplayName "Smart Parking Java Backend" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
   ```
3. Make sure your Wi-Fi network profile is set to **Private** (Settings -> Network & Internet -> Wi-Fi -> Network Properties -> Private network).

#### macOS:
1. System Settings -> Network -> Firewall -> Options.
2. Ensure "Block all incoming connections" is **OFF**.
3. When prompted, allow Node/Java to accept incoming network connections.

#### Linux (UFW):
```bash
sudo ufw allow 3000/tcp
sudo ufw allow 8080/tcp
sudo ufw status
```

---

### 8. Connecting from Another Computer or Mobile Phone

1. Ensure **both devices are connected to the same Wi-Fi / Router**.
2. Open any web browser (Chrome, Edge, Safari, Firefox) on:
   - **Computer 2 / Laptop**
   - **Android / iPhone**
   - **Tablet**
3. In the browser address bar, type:
   ```
   http://192.168.1.15:3000
   ```
   *(Replace `192.168.1.15` with your main computer's actual IPv4 address)*
4. Press Enter. The Smart Parking Management System will load immediately!
5. In the top navbar, notice the green pill:
   `🟢 Real-Time Sync (2 dev)`
   This confirms both devices are connected to the live synchronization engine.

---

### 9. Step-by-Step Testing Checklist on Second Computer

Follow this test scenario to demonstrate multi-user access:

- [ ] **Step 1: Open on Two Devices Simultaneously**
  - Main Computer: open `http://localhost:3000` (Driver Rahul)
  - Second Computer: open `http://192.168.1.15:3000` (Admin Officer Vikram)
- [ ] **Step 2: Verify Real-Time Sync Indicator**
  - Both screens should show `Real-Time Sync (2 dev)`.
- [ ] **Step 3: Test Real-Time Slot Booking**
  - On Main Computer, go to **Parking Slots** -> Select Location 1 -> Click **G-04** -> Click **Book Bay**.
  - Complete the booking (select Car, 2 Hours, click Confirm Reservation).
  - Look at the Second Computer: Slot `G-04` **instantly turns yellow (Reserved)** without refreshing the second computer!
- [ ] **Step 4: Test QR Gate Barrier Entry**
  - On the Second Computer (Admin), click **Gate Scanner** in navbar.
  - Enter or scan the booking code (e.g. `PK-XXXXX`).
  - Click **Verify Vehicle Entry**.
  - Look at the Main Computer: Slot `G-04` **instantly turns red (Occupied)** with live timer!
- [ ] **Step 5: Test Early Exit / Release**
  - On the Second Computer, in the Gate Scanner, click **Check Out & Release Bay**.
  - Both screens immediately update `G-04` back to **green (Available)**!
- [ ] **Step 6: Test Responsive Layout on Mobile Phone**
  - Open `http://192.168.1.15:3000` on your Android/iPhone browser.
  - Verify that the navigation bar, tariff calculator, booking form, and slot grid adapt smoothly to the touch screen.

---

### 10. Troubleshooting Common Errors

#### Error 1: "Connection Refused" or "Site can't be reached"
- **Cause:** The server is either not running, or bound only to `localhost` (127.0.0.1) instead of `0.0.0.0`.
- **Solution:**
  1. Confirm `server.ts` is running and reports `http://0.0.0.0:3000`.
  2. Verify that both computers are connected to the exact same Wi-Fi SSID / Router.
  3. Ping the main computer from Computer 2:
     ```bash
     ping 192.168.1.15
     ```

#### Error 2: "Website opens on host computer but not on second computer"
- **Cause:** Windows Defender Firewall or router client isolation is blocking inbound port 3000.
- **Solution:**
  1. Add inbound firewall rule for port 3000 (see Section 7 above).
  2. Temporarily turn off Windows Firewall for 2 minutes to test if firewall is the blocker.
  3. Ensure your Wi-Fi is set to "Private network", not "Public network".

#### Error 3: "CORS Error" (Cross-Origin Request Blocked)
- **Cause:** The Java backend is rejecting cross-origin requests from the client's IP.
- **Solution:**
  1. The project's `backend/src/main/java/com/smartparking/servlet/CorsFilter.java` and `server.ts` are pre-configured to allow all origins (`*`) with pre-flight `OPTIONS` caching.
  2. Set `ALLOWED_ORIGINS=*` in your backend environment if needed.

#### Error 4: "Cannot Connect to Backend" / "API Not Found" (404)
- **Cause:** Incorrect API base URL in frontend.
- **Solution:**
  1. If running full-stack, leave `VITE_BACKEND_API_URL` empty to use relative `/api`.
  2. If using separate Tomcat, ensure Tomcat URL includes context path:
     `http://192.168.1.15:8080/smartparking/api` (not just `:8080/api`).
  3. Check health status in browser: `http://192.168.1.15:3000/api/health`.

#### Error 5: "MySQL Connection Error / Communications link failure"
- **Cause:** MySQL service is not running or rejecting remote connections.
- **Solution:**
  1. Verify MySQL service is active:
     - Windows: Open `services.msc`, locate `MySQL80`, verify status is "Running".
     - Linux: `sudo systemctl status mysql`.
  2. Check credentials in `DBConnection.java` or environment variables:
     - `SMART_PARKING_DB_USER=root`
     - `SMART_PARKING_DB_PASS=your_password`
  3. If MySQL is hosted remotely, verify that SSL parameters are enabled (pre-configured in `DBConnection.java`).
