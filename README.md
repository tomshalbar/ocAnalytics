# ocAnalytics
 

## Repo structure
 
```
ocAnalytics/
├── mobile/       # React Native (Expo) app
├── modeling/     # Python logic model — source of truth, prototyping & validation
├── backend/      # REST API + database (FastAPI, when needed)
└── docs/         # Logic model spec and other documentation
```
 
## Prerequisites
 
Install these before setting up the project:
 
- [Node.js](https://nodejs.org/) (LTS version)
- [Git](https://git-scm.com/)
- [Python 3.12](https://www.python.org/downloads/)
- [Conda](https://docs.conda.io/projects/conda/en/latest/user-guide/install/index.html)
- [Expo Go](https://expo.dev/go) app on your phone (for testing on-device) *or* Android Studio / Xcode if you want simulators
## Getting started
 
### 1. Clone the repo
 
```bash
git clone https://github.com/tomshalbar/ocAnalytics.git
cd ocAnalytics
```
 
### 2. Set up the Python Environment
 
Create the Conda environment from `environment.yml`:

```bash
conda env create -f environment.yml
conda activate osa_env
```
 
### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
DATABASE_URL=your_supabase_postgres_connection_string
```

Do not commit the `.env` file to GitHub.
The production workflow uses GitHub Secrets for sensitive environment variables.

### 4. Run the Backend Locally

From the project root:

```bash
uvicorn backend.main:app --reload
```

The API will be available at:
```bash
http://127.0.0.1:8000
```

FastAPI documentation:

```bash
http://127.0.0.1:8000/docs
```

### 5. Test the RecSports Data Pipeline

From the project root:
```bash
python -m modeling.src.scrape_pipeline
```

A successful run should scrape the latest RecSports occupancy data and insert it into the Supabase PostgreSQL database.

### 6. Run the Mobile Application

```bash
cd mobile
npm install
npx expo start
```