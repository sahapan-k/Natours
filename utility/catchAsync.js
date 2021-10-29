/* eslint-disable arrow-body-style */
const catchAsync = (fn) => {
  return (request, response, next) => {
    fn(request, response, next).catch(next);
  };
};

module.exports = catchAsync;
