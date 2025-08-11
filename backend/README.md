# Vibesy Backend

This is a FastAPI backend for the Vibesy app, integrated with Supabase for authentication and location storage.

## Features
- User registration and login (Supabase Auth)
- CRUD operations for saved locations (Supabase Database)
- RESTful API endpoints

## Setup
1. Copy `.env` and fill in your Supabase credentials.
2. Install dependencies (already installed in the virtual environment):
   ```sh
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
3. Run the server:
   ```sh
   uvicorn main:app --reload
   ```

## Endpoints
- `POST /register` — Register a new user
- `POST /login` — Login and get access token
- `GET /locations?user_id=...` — Get all locations for a user
- `POST /locations` — Add a new location
- `DELETE /locations/{location_id}?user_id=...` — Delete a location

## Notes
- Make sure your Supabase project has a `locations` table with the appropriate schema.
- This backend is designed to work with the Vibesy frontend app.
