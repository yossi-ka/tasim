# NBS API Server

This is a standalone Express server for NBS order normalization.

## Endpoints

- `GET /test` — returns `{ status: "ok" }`
- `GET /fetch-and-normalize` — runs the fetch and normalize process and returns the result as JSON

## Usage

1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the server:
   ```sh
   npm start
   ```
3. Access endpoints at `http://localhost:3000/test` and `http://localhost:3000/fetch-and-normalize`

## Build as EXE

To compile this project into a standalone Windows executable (no Node.js required), use [pkg](https://github.com/vercel/pkg):

1. Install pkg globally:
   ```sh
   npm install -g pkg
   ```
2. Build the executable:
   ```sh
   pkg . --targets node18-win-x64 --output nbs-api-server.exe
   ```
3. Run `nbs-api-server.exe` on any Windows machine.
