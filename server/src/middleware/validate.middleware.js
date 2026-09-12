export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error.errors && Array.isArray(error.errors)) {
        const errorMessages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
        return res.status(400).json({
          success: false,
          message: errorMessages,
          errors: error.errors
        });
      }
      return res.status(400).json({
        success: false,
        message: error.message || 'Validation error'
      });
    }
  };
};
