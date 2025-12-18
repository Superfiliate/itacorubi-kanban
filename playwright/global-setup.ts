import { resetTestDb } from "./utils/db";

async function globalSetup() {
  // Reset test database before all tests run
  resetTestDb();
}

export default globalSetup;
