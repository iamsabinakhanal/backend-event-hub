export type ContactIdParams = {
  id: string;
};

export type ContactCreateBody = {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
};

export type ContactReplyBody = {
  reply_message: string;
};
