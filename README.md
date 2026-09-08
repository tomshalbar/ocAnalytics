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
- [Python 3.11+](https://www.python.org/downloads/)
- [uv](https://docs.astral.sh/uv/getting-started/installation/) — Python package/environment manager
- [Expo Go](https://expo.dev/go) app on your phone (for testing on-device) *or* Android Studio / Xcode if you want simulators
## Getting started
 
### 1. Clone the repo
 
```bash
git clone https://github.com/tomshalbar/ocAnalytics.git
cd ocAnalytics
```
 
### 2. Set up the mobile app
 
```bash
cd mobile
npm install
npx expo start
```
 
Scan the QR code with the Expo Go app on your phone, or press `a` / `i` in the terminal to launch an Android/iOS simulator.
 
> Do not manually edit `package-lock.json`. It's committed so everyone installs identical dependency versions — always add/update packages via `npm install <package>`.
 