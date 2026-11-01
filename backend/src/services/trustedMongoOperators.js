import mongoose from 'mongoose';

// Only use these helpers for fixed server-side filters or values validated by
// the application. They preserve intentional operators while sanitizeFilter
// continues protecting untrusted request-derived MongoDB filters.
export const trustedIn = (values) => mongoose.trusted({ $in: values });
export const trustedLessThan = (value) => mongoose.trusted({ $lt: value });
