# Formula 1 Tracker Mobile App 🏎️

A comprehensive Formula 1 tracking mobile application built with Expo React Native and FastAPI. Track live races, championship standings, driver performance, and race schedules - all in a beautiful native mobile interface.

## 🏁 Features

### Core Features
- **Championship Standings**: Real-time driver and constructor championship standings
- **Race Schedule**: Complete season calendar with countdown timers to next race
- **Driver Profiles**: Detailed information on all F1 drivers with their permanent numbers
- **Team Information**: Complete constructor details with team colors
- **Historical Data**: Access to historical race results and standings
- **Live Race Tracking**: Integration with OpenF1 API for race data (future enhancement)

### User Experience
- **Pull-to-Refresh**: All data screens support pull-to-refresh for latest updates
- **Team Colors**: Visual hierarchy using official F1 team colors
- **Country Flags**: Driver and team nationality flags for quick recognition
- **Countdown Timers**: Real-time countdown to next Grand Prix
- **Mobile-First Design**: Optimized for touch interactions and mobile screens
- **Dark Theme**: Eye-friendly dark theme throughout the app

## 📱 Screenshots

The app includes:
- Home screen with quick access cards
- Driver and Constructor standings with podium indicators
- Full season calendar with race details
- Driver list with permanent numbers and codes
- Team list with color-coded stripes

## 🛠️ Technology Stack

### Frontend
- **Framework**: Expo React Native 54.0
- **Navigation**: Expo Router (file-based routing)
- **UI Components**: React Native core components
- **Icons**: @expo/vector-icons (Ionicons)
- **State Management**: React hooks
- **Safe Areas**: react-native-safe-area-context

### Backend
- **Framework**: FastAPI 0.110.1
- **Database**: MongoDB with Motor (async driver)
- **HTTP Client**: httpx for external API calls
- **CORS**: Enabled for cross-origin requests

### Data Sources
- **Jolpica F1 API**: Historical data, standings, schedules, race results
  - Base URL: `https://api.jolpi.ca/ergast/f1/`
  - Free, no authentication required
  - Complete historical F1 data from 1950-present
  
- **OpenF1 API**: Real-time race data and telemetry
  - Base URL: `https://api.openf1.org/v1/`
  - Free for historical data (sessions >30 mins old)
  - Live data requires paid subscription

## 📂 Project Structure

```
/app
├── backend/
│   ├── server.py          # FastAPI backend with all F1 API endpoints
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Environment variables
├── frontend/
│   ├── app/              # Expo Router screens
│   │   ├── _layout.tsx   # Root layout with navigation
│   │   ├── index.tsx     # Home screen
│   │   ├── standings.tsx # Championship standings
│   │   ├── schedule.tsx  # Race schedule
│   │   ├── drivers.tsx   # Drivers list
│   │   └── teams.tsx     # Teams list
│   ├── package.json      # Frontend dependencies
│   └── .env             # Frontend environment variables
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and Yarn
- Python 3.11+
- MongoDB
- Expo Go app (for mobile testing)

### Installation

1. **Backend Setup**
```bash
cd /app/backend
pip install -r requirements.txt
```

2. **Frontend Setup**
```bash
cd /app/frontend
yarn install
```

3. **Environment Variables**
Backend `.env`:
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=f1_tracker
```

Frontend `.env`:
```
EXPO_PUBLIC_BACKEND_URL=<your-backend-url>
```

### Running the App

1. **Start Backend**
```bash
cd /app/backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

2. **Start Frontend**
```bash
cd /app/frontend
yarn start
```

3. **Test on Mobile**
- Scan the QR code with Expo Go app (iOS/Android)
- Or press 'w' to open in web browser

## 🔌 API Endpoints

### F1 Data Endpoints

#### Standings
- `GET /api/standings/drivers` - Current driver standings
- `GET /api/standings/constructors` - Current constructor standings

#### Schedule & Results
- `GET /api/schedule` - Race schedule for current season
- `GET /api/race/{round}/results` - Race results for specific round
- `GET /api/race/{round}/qualifying` - Qualifying results
- `GET /api/race/{round}/sprint` - Sprint race results

#### Drivers & Teams
- `GET /api/drivers` - All drivers for current season
- `GET /api/drivers/{driver_id}` - Specific driver details
- `GET /api/constructors` - All constructors
- `GET /api/constructors/{constructor_id}` - Specific constructor details

#### Live Data (OpenF1)
- `GET /api/live/sessions` - Recent F1 sessions
- `GET /api/live/positions?session_key={key}` - Race positions
- `GET /api/live/laps?session_key={key}` - Lap times
- `GET /api/live/intervals?session_key={key}` - Race intervals

#### User Favorites
- `GET /api/user/{user_id}/favorites` - Get user favorites
- `POST /api/user/{user_id}/favorites` - Update favorites
- `POST /api/user/{user_id}/favorites/driver/{driver_id}` - Add favorite driver
- `DELETE /api/user/{user_id}/favorites/driver/{driver_id}` - Remove favorite driver
- `POST /api/user/{user_id}/favorites/team/{team_id}` - Add favorite team
- `DELETE /api/user/{user_id}/favorites/team/{team_id}` - Remove favorite team

## 🎨 Design System

### Colors
- **Primary Red**: #E10600 (Ferrari Red - F1 branding)
- **Secondary Cyan**: #00D2BE (Mercedes Cyan)
- **Background**: #0c0c0c (Deep black)
- **Card Background**: #1a1a1a
- **Border**: #2a2a2a

### Team Colors
- Red Bull: #0600EF
- Ferrari: #DC0000
- Mercedes: #00D2BE
- McLaren: #FF8700
- Alpine: #0090FF
- Aston Martin: #006F62
- Williams: #005AFF
- Haas: #FFFFFF

### Typography
- **Headers**: Bold, White
- **Body**: Regular, #ccc
- **Secondary**: #999
- **Labels**: Uppercase, tracked

## 🧪 Testing

### Backend Testing
```bash
# Test all endpoints
curl https://your-app.preview.emergentagent.com/api/health
curl https://your-app.preview.emergentagent.com/api/standings/drivers
```

### Frontend Testing
Use Expo Go app to test on physical devices:
1. iOS: Scan QR code with Camera app
2. Android: Scan QR code with Expo Go app

## 📋 Roadmap

### Phase 1: MVP ✅
- [x] Basic navigation structure
- [x] Championship standings (drivers & constructors)
- [x] Race schedule with countdown
- [x] Driver and team lists
- [x] Pull-to-refresh functionality

### Phase 2: Enhanced Features
- [ ] Driver detail pages with full stats
- [ ] Team detail pages with driver lineup
- [ ] Race results view with podium
- [ ] Qualifying results display
- [ ] Historical data search

### Phase 3: Personalization
- [ ] User favorites implementation
- [ ] Filter by favorite drivers/teams
- [ ] Push notifications for race start
- [ ] Customizable widgets

### Phase 4: Live Features
- [ ] Live race tracking
- [ ] Real-time position updates
- [ ] Lap times and intervals
- [ ] Race control messages
- [ ] Native device widgets (iOS/Android)

## ⚖️ Legal

This app is **not affiliated with, endorsed by, or sponsored by Formula One Licensing BV**.

Formula 1, F1, and related marks are trademarks of Formula One Licensing BV.

All data is sourced from:
- Jolpica F1 API (open-source, successor to Ergast)
- OpenF1 API (open-source project)

## 🤝 Contributing

This is an MVP project. Future enhancements include:
- Native device widgets
- Push notifications
- Live race tracking
- Telemetry visualization
- Driver comparison tools

## 📝 License

This project is for educational purposes. All F1 trademarks belong to Formula One Licensing BV.

## 🔗 Resources

- [Jolpica F1 API Documentation](https://github.com/jolpica/jolpica-f1)
- [OpenF1 API Documentation](https://openf1.org/docs/)
- [Expo Documentation](https://docs.expo.dev/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

---

Built with ❤️ for F1 fans worldwide 🏁
