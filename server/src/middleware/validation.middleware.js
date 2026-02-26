export const validateRequest = (schema, source = "body") => {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const validatedData = schema.parse(dataToValidate);
      req[source] = validatedData;
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: error.errors,
      });
    }
  };
};
