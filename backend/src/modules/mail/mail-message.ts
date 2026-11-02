/** What a template produces. `text` is the fallback for mail clients that do not show HTML. */
export interface MailContent {
  subject: string;
  text: string;
  html: string;
}
