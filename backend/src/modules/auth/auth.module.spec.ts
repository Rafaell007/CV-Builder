import { ApiConventionsModule } from "../../common/api-conventions";
import { AuthModule } from "./auth.module";

describe("AuthModule in AppModule", () => {
  it("is imported before the role and verified guards, so request.user exists when they run", async () => {
    // Global guards run in registration order, which follows the order of the imports.
    process.env["DATABASE_URL"] = "postgresql://user:password@localhost:5432/test";
    process.env["JWT_ACCESS_SECRET"] = "unit-test-access-secret-0123456789abc";
    process.env["JWT_REFRESH_SECRET"] = "unit-test-refresh-secret-0123456789ab";
    const { AppModule } = await import("../../app.module.js");

    const imports = Reflect.getMetadata("imports", AppModule) as unknown[];

    expect(imports.indexOf(AuthModule)).toBeGreaterThanOrEqual(0);
    expect(imports.indexOf(AuthModule)).toBeLessThan(imports.indexOf(ApiConventionsModule));
  });
});
