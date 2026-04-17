// ============================================================
// middleware/errorHandler.js — Catches all unhandled errors
// OWNER: Gaurav Parashar
// Any time a controller calls next(err), this function runs.
// It logs the error and sends a clean JSON response instead of
// crashing the server or leaking internal stack traces.
// ============================================================

module.exports = function errorHandler(err, req, res, next) {
  // Log the full error internally so we can debug it
  console.error("[ERROR]", err.message, err.stack);

  // Send a user-friendly error message (never expose the full stack trace)
  res.status(err.status || 500).json({
    error: err.message || "Something went wrong on the server.",
  });
};
