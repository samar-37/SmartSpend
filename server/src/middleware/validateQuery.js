export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const error = new Error('Invalid query parameters');
      error.statusCode = 400;
      error.details = result.error.flatten().fieldErrors;
      return next(error);
    }
    req.validatedQuery = result.data;
    return next();
  };
}
