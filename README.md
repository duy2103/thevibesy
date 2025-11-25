# Vibesy

Vibesy is a modern location-sharing application with a FastAPI backend and React Native/Expo frontend. Users can save and share their favorite places, view them on interactive maps, and manage their location collections.

## ✨ Features

- 🔐 **User Authentication** - Register and login with Supabase Auth
- 📍 **Location Management** - Save, view, and delete favorite locations  
- 🗺️ **Interactive Maps** - Native maps on mobile, Leaflet maps on web
- 📱 **Cross-Platform** - Works on iOS, Android, and Web
- 🔍 **Address Search** - Search and select addresses using OpenStreetMap
- ⚡ **Real-time Updates** - Live location tracking and updates

## 🏗️ Project Structure

```
vibesy-backup/
├── backend/          # FastAPI Python backend
│   ├── main.py       # Main API server
│   ├── .env          # Environment configuration  
│   └── venv/         # Python virtual environment
├── client/           # React Native/Expo frontend
│   ├── app/          # App screens and components
│   ├── assets/       # Images and fonts
│   └── package.json  # Node.js dependencies
├── start-backend.sh  # Backend startup script
└── start-client.sh   # Client startup script
```

## 🚀 Quick Start

### Option 1: Using Startup Scripts (Recommended)

```bash
# Start backend (Terminal 1)
./start-backend.sh

# Start client (Terminal 2)  
./start-client.sh
```

### Option 2: Manual Setup

#### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Activate virtual environment:**
   ```bash
   source venv/bin/activate
   ```

3. **Start the server:**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

#### Client Setup

1. **Navigate to client directory:**
   ```bash
   cd client
   ```

2. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Start development server:**
   ```bash
   npm start
   ```

## 🛠️ Configuration

### Backend Configuration

1. **Copy environment file:**
   ```bash
   cp backend/.env.example backend/.env
   ```

2. **Update Supabase credentials in `backend/.env`:**
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_KEY=your-service-role-key
   ```

### Client Configuration

The client is pre-configured to work with:
- **Web**: `http://localhost:8000` 
- **Mobile**: `http://10.0.2.2:8000` (Android Emulator)

## 🌐 API Endpoints

- `GET /` - API health check
- `GET /health` - Detailed health status  
- `POST /register` - User registration
- `POST /login` - User login
- `GET /locations` - Get user's saved locations
- `POST /locations` - Add new location
- `DELETE /locations/{id}` - Delete location

## 🎯 Usage

1. **Start both backend and client services**
2. **Open the web app at `http://localhost:8081`**  
3. **Register a new account or skip for demo mode**
4. **View the interactive map**
5. **Add new locations by tapping the + button**
6. **Search for addresses and save your favorite places**

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Kill process on port 8081  
lsof -ti:8081 | xargs kill -9
```

**Node modules issues:**
```bash
cd client
npm run clean
npm install --legacy-peer-deps
```

**Python dependency issues:**
```bash
cd backend
source venv/bin/activate  
pip install --upgrade pip
pip install -r requirements.txt
```

**Supabase connection issues:**
- Verify credentials in `backend/.env`
- Check Supabase project status
- Ensure API keys have proper permissions

## 🔧 Development

### Backend Development
- FastAPI with automatic OpenAPI docs at `http://localhost:8000/docs`
- Hot reload enabled during development
- Supabase integration for auth and data storage

### Client Development  
- Expo/React Native with hot reload
- Cross-platform compatibility (iOS, Android, Web)
- Leaflet integration for web maps
- React Native Maps for mobile platforms

## 📱 Platforms

- **iOS**: Full native experience with Apple Maps integration
- **Android**: Native experience with Google Maps  
- **Web**: Responsive web app with Leaflet maps

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)  
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Supabase** for authentication and database services
- **Expo** for cross-platform development framework
- **Leaflet** for web mapping functionality  
- **OpenStreetMap** for map tiles and geocoding services
