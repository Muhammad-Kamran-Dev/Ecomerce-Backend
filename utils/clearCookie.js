exports.clearCookie = (res, tokenName) => {
  res.cookie(tokenName, null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
};
