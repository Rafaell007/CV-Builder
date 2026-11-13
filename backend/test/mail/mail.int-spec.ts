import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { AppConfigModule, type Environment } from "../../src/config";
import { MailModule, MailService } from "../../src/modules/mail";
import { buildPasswordResetLink } from "../../src/modules/mail/templates/password-reset.template";

// Mailpit web port from docker-compose.yml, where the API runs. It is not an app setting, so no env var holds it.
const MAILPIT_API = "http://localhost:8025/api/v1";

interface MailpitMessage {
  Subject: string;
  Text: string;
}

/** The mails Mailpit holds for one recipient, with their full text. */
async function findMails(recipient: string): Promise<MailpitMessage[]> {
  const search = await fetch(
    `${MAILPIT_API}/search?query=${encodeURIComponent(`to:${recipient}`)}`,
  );
  const { messages } = (await search.json()) as { messages: { ID: string }[] };

  return Promise.all(
    messages.map(async ({ ID }) => {
      const response = await fetch(`${MAILPIT_API}/message/${ID}`);
      return (await response.json()) as MailpitMessage;
    }),
  );
}

describe("mail (needs Mailpit: docker compose up -d)", () => {
  let mail: MailService;
  let frontendUrl: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppConfigModule, MailModule],
    }).compile();
    mail = moduleRef.get(MailService);
    frontendUrl = moduleRef
      .get<ConfigService<Environment, true>>(ConfigService)
      .get("FRONTEND_URL", {
        infer: true,
      });
  });

  it("delivers the verification code to Mailpit", async () => {
    const recipient = `code-${randomUUID()}@example.com`;

    await mail.sendVerificationCode(recipient, "123456");

    const [message, ...others] = await findMails(recipient);
    expect(others).toHaveLength(0);
    expect(message?.Subject).toBe("Your CV Builder verification code");
    expect(message?.Text).toContain("123456");
  });

  it("delivers the password reset link to Mailpit", async () => {
    const recipient = `reset-${randomUUID()}@example.com`;

    await mail.sendPasswordReset(recipient, "reset-token-1");

    const [message] = await findMails(recipient);
    expect(message?.Subject).toBe("Reset your CV Builder password");
    expect(message?.Text).toContain(buildPasswordResetLink(frontendUrl, "reset-token-1"));
  });
});
