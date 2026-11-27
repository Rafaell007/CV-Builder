import { Test } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { MAIL_TRANSPORT } from "./mail-transport";
import { MailService } from "./mail.service";

const SETTINGS: Record<string, string> = {
  FRONTEND_URL: "https://cv.example.com",
  MAIL_FROM: "CV Builder <no-reply@cv.example.com>",
};

describe("MailService", () => {
  let service: MailService;
  const sendMail = jest.fn();

  beforeEach(async () => {
    sendMail.mockReset().mockResolvedValue({ messageId: "1" });

    const moduleRef = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: MAIL_TRANSPORT, useValue: { sendMail } },
        { provide: ConfigService, useValue: { get: (name: string) => SETTINGS[name] } },
      ],
    }).compile();

    service = moduleRef.get(MailService);
  });

  describe("sendVerificationCode", () => {
    it("sends the code from the configured sender to the user", async () => {
      await service.sendVerificationCode("ada@example.com", "123456");

      expect(sendMail).toHaveBeenCalledTimes(1);
      expect(sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "CV Builder <no-reply@cv.example.com>",
          to: "ada@example.com",
          subject: "Your CV Builder verification code",
          text: expect.stringContaining("123456"),
          html: expect.stringContaining("123456"),
        }),
      );
    });
  });

  describe("sendPasswordReset", () => {
    it("sends a link that starts with FRONTEND_URL", async () => {
      await service.sendPasswordReset("ada@example.com", "tok-1");

      const message = sendMail.mock.calls[0]?.[0] as { to: string; text: string; html: string };
      expect(message.to).toBe("ada@example.com");
      expect(message.text).toContain("https://cv.example.com/reset-password?token=tok-1");
      expect(message.html).toContain('href="https://cv.example.com/reset-password?token=tok-1"');
    });
  });

  it("rejects when the transport fails, so the caller can handle it", async () => {
    sendMail.mockRejectedValue(new Error("connection refused"));

    await expect(service.sendVerificationCode("ada@example.com", "123456")).rejects.toThrow(
      "connection refused",
    );
  });
});
