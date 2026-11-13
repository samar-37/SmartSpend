export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const error = new Error('Invalid request data');
      error.statusCode = 400;
      error.details = result.error.flatten().fieldErrors;
      return next(error);
    }
    req.body = result.data;
    return next();
  };
}
