import { ConfigService } from "@nestjs/config";
import { createTransport } from "nodemailer";
import { mailTransportProvider } from "./mail-transport";

jest.mock("nodemailer", () => ({ createTransport: jest.fn(() => ({})) }));

function build(settings: Record<string, unknown>): void {
  const config = { get: (name: string) => settings[name] } as unknown as ConfigService;
  const factory = (mailTransportProvider as { useFactory: (config: ConfigService) => unknown })
    .useFactory;
  factory(config);
}

describe("mailTransportProvider", () => {
  beforeEach(() => jest.mocked(createTransport).mockClear());

  it("connects to the configured host and port without a login for Mailpit", () => {
    build({ SMTP_HOST: "localhost", SMTP_PORT: 1025, SMTP_USER: "", SMTP_PASS: "" });

    expect(createTransport).toHaveBeenCalledWith({
      host: "localhost",
      port: 1025,
      secure: false,
    });
  });

  it("adds the login when both user and password are set", () => {
    build({ SMTP_HOST: "smtp.example.com", SMTP_PORT: 587, SMTP_USER: "u", SMTP_PASS: "p" });

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ auth: { user: "u", pass: "p" } }),
    );
  });
});
