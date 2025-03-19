export class APIError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = "APIError";
  }
}

export const handleApiError = (error: unknown) => {
  console.error("API Error:", error);

  if (error instanceof APIError) {
    return {
      statusCode: error.statusCode,
      error: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      statusCode: 500,
      error: error.message,
    };
  }

  return {
    statusCode: 500,
    error: "予期せぬエラーが発生しました",
  };
};

export const createApiHandler = (handler: Function) => {
  return async (req: any, res: any) => {
    try {
      await handler(req, res);
    } catch (error) {
      const { statusCode, error: errorMessage } = handleApiError(error);
      res.status(statusCode).json({ error: errorMessage });
    }
  };
};

export const validateRequestMethod = (req: any, allowedMethods: string[]) => {
  if (!allowedMethods.includes(req.method)) {
    throw new APIError(`Method ${req.method} not allowed`, 405);
  }
};

export const validateSession = (session: any) => {
  if (!session?.user?.id) {
    throw new APIError("認証が必要です", 401);
  }
  return session.user;
};
