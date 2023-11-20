const { ErrorHandler } = require("./ErrorHandler");

const isAlphabetIncluded = (mobileNumber) => {
  // check if mobile number include alphabet or not
  const alphabetRegex = /[a-zA-Z]/;
  return alphabetRegex.test(mobileNumber);
};

const getFormattedMobileNumber = (mobileNumber) => {
  const firstPart = mobileNumber.slice(0, 4);
  const secondPart = mobileNumber.slice(4);
  return `${firstPart}-${secondPart}`;
};

exports.checkMobileNumber = (updatedMobileNo, next) => {
  //Check if the mobile number contains alphabet or not
  if (isAlphabetIncluded(updatedMobileNo)) {
    return next(
      new ErrorHandler("Mobile number should not contain alphabet", 400)
    );
  }
  //Convert mobile number from 03119288190 to 0311-9288190 format
  const formattedMobileNo = getFormattedMobileNumber(updatedMobileNo);
  if (formattedMobileNo.length > 12) {
    // Basically 0311-9288190 is 11 digits but i add - in between so it becomes 12 digits
    return next(new ErrorHandler("Mobile number should be 11 digits", 400));
  }

  return formattedMobileNo;
};
