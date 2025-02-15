export type AccessToken = {
  token: string;
  expiresIn: number;
};

export type RefreshToken = AccessToken;
