// Mailpit catches the mail of the local and CI backend (docker-compose.yml, ci.yml). Its web API runs on 8025.
const MAILPIT_API = "http://localhost:8025/api/v1";

type MailpitSearch = { messages: { ID: string }[] };
type MailpitMessage = { Subject: string; Text: string };

/** The text of every mail sent to `recipient`, newest first. */
export async function findMails(recipient: string): Promise<MailpitMessage[]> {
  const search = await fetch(
    `${MAILPIT_API}/search?query=${encodeURIComponent(`to:${recipient}`)}`,
  );
  const { messages } = (await search.json()) as MailpitSearch;

  return Promise.all(
    messages.map(async ({ ID }) => {
      const response = await fetch(`${MAILPIT_API}/message/${ID}`);
      return (await response.json()) as MailpitMessage;
    }),
  );
}

/** The 6-digit code in the newest verification mail to `recipient`, or undefined while no mail arrived. */
export async function findVerificationCode(recipient: string): Promise<string | undefined> {
  const mail = (await findMails(recipient)).find(({ Subject }) =>
    Subject.includes("verification code"),
  );
  return mail?.Text.match(/verification code is: (\d{6})/)?.[1];
}

/** The `token` of the reset link in the newest reset mail to `recipient`, or undefined while no mail arrived. */
export async function findResetToken(recipient: string): Promise<string | undefined> {
  const mail = (await findMails(recipient)).find(({ Subject }) => Subject.includes("Reset your"));
  return mail?.Text.match(/[?&]token=([^\s&]+)/)?.[1];
}
