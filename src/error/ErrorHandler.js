module.exports = (err, req, res, next) => {
  const { status, message } = err;
  res.status(status).send({
    path: req.originalUrl,
    timestamp: new Date().getTime(),
    message,
  });
};
