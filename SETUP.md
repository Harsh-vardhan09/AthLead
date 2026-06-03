# SETUP.md


## Local Development Setup

This guide explains how to set up and run AthLead locally for development.

---

## Prerequisites

Ensure the following are installed on your system:

- Git
- Node.js (v18+ recommended)
- npm
- Python (v3.10+ recommended)
- pip

How to verify installations:

```bash
git --version
node --version
npm --version
python3 --version
pip --version
```

---


## Clone the Repository

```bash
git clone https://github.com/Harsh-vardhan09/AthLead.git
cd AthLead
```

---


## Project Structure

```text
AthLead/
├── Athlead-client/    # Frontend (React + Vite)
├── Backend/           # Backend (Node.js + Express)
├── ML/                # ML Service (FastAPI + Scikit-learn)
├── README.md
└── SETUP.md
```

---


## Environment Variables

Create a `.env` file inside the `Backend` directory.
> The values shown below are examples. Replace them with your actual credentials and configuration.

Example:

```env
SERVER_PORT=5000
FRONTEND_URL=http://localhost:5173

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d

ML_URI=http://localhost:8000

GNEWS_API=your_gnews_api_key

CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_SECRET=your_cloudinary_api_secret
```

### Variable Descriptions

| Variable | Description |
|-----------|------------|
| SERVER_PORT | Backend server port |
| FRONTEND_URL | Frontend URL used for CORS |
| MONGODB_URI | MongoDB connection string |
| JWT_SECRET | Secret key for JWT generation |
| JWT_EXPIRE | JWT expiration time |
| ML_URI | URL of the ML service |
| GNEWS_API | GNews API key |
| CLOUD_NAME | Cloudinary cloud name |
| CLOUD_API_KEY | Cloudinary API key |
| CLOUD_SECRET | Cloudinary API secret |

---


# Frontend Setup


Navigate to the frontend directory:

```bash
cd Athlead-client
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Useful commands:

```bash
npm run build
npm run preview
npm run lint
```

The frontend will typically run on:

```text
http://localhost:5173
```

---


# Backend Setup


Open a new terminal:

```bash
cd Backend
```

Install dependencies:

```bash
npm install
```

Start the backend server:

```bash
npm run dev
```

or

```bash
npm run server
```

The backend runs on the port specified by `SERVER_PORT`.


### MongoDB Setup

AthLead requires a MongoDB database connection.

You can use:

- MongoDB Atlas (cloud-hosted)
- Local MongoDB installation

Update the `MONGODB_URI` variable in the Backend `.env` file accordingly.

---


# ML Service Setup


Open a third terminal:

```bash
cd ML
```

Create a virtual environment.

### macOS/Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### Required Model Files

The ML service expects trained model artifacts inside:

```text
ML/models/
├── athlete_rank_model.pkl
├── scaler.pkl
└── label_encoders.pkl
```

Ensure these files are available before starting the service.

Start the FastAPI server:

```bash
uvicorn api:app --reload
```

If `uvicorn` is unavailable:

```bash
python -m uvicorn api:app --reload
```

The ML service is typically available at:

```text
http://localhost:8000
```
Once running, FastAPI documentation is available at:

```text
http://localhost:8000/docs
```

Alternative schema view:
```text
http://localhost:8000/redoc
```

---

# Running the Full Application

After completing the setup steps above, start the services in separate terminals:


### Terminal 1 — Frontend

```bash
cd Athlead-client
npm install
npm run dev
```

### Terminal 2 — Backend

```bash
cd Backend
npm install
npm run server
```

### Terminal 3 — ML Service

```bash
cd ML

python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt

uvicorn api:app --reload
```

---

## Service Dependency Flow

```text
Frontend (React)
        ↓
Backend (Express)
        ↓
MongoDB
        ↓
ML Service (FastAPI)
```

For score prediction and ranking features to work correctly:

- Frontend must be running
- Backend must be running
- ML service must be running
- MongoDB must be accessible

---

## Troubleshooting

### Node Module Issues

```bash
rm -rf node_modules package-lock.json
npm install
```

### Python Dependency Issues

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Port Already in Use

Update the application configuration or stop the process currently using the port.

### Environment Variable Errors

Ensure all required environment variables are present in the `Backend/.env` file.

---

## Additional Resources

- Frontend: React + Vite
- Backend: Express + MongoDB
- ML Service: FastAPI + Scikit-learn