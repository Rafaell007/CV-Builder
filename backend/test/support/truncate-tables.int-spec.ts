import { Client } from "pg";
import { getTestDatabaseUrl } from "./test-database-url";
import { truncateTables } from "./truncate-tables";

describe("truncateTables", () => {
  const client = new Client({ connectionString: getTestDatabaseUrl() });

  beforeAll(() => client.connect());
  afterAll(async () => {
    await client.query("DROP TABLE IF EXISTS truncate_probe");
    await client.end();
  });

  it("empties the tables but keeps them", async () => {
    await client.query("CREATE TABLE IF NOT EXISTS truncate_probe (id serial PRIMARY KEY)");
    await client.query("INSERT INTO truncate_probe DEFAULT VALUES");

    await truncateTables();

    const { rows } = await client.query<{ count: string }>("SELECT count(*) FROM truncate_probe");
    expect(rows[0]?.count).toBe("0");
  });
});
