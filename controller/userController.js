const User = require('../models/userModel');
const sharp = require('sharp');
const AppError = require('../utility/appError');
const catchAsync = require('../utility/catchAsync');
const factory = require('./handleFactory');
const multer = require('multer');

// const multerStorage = multer.diskStorage({
//   destination: (request, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (request, file, cb) => {
//     const extention = file.mimetype.split('/')[1];
//     cb(null, `user-${request.user.id}-${Date.now()}.${extention}`);
//   },
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (request, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new AppError('Not an image! Please choose image file type.', 400),
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((element) => {
    if (allowedFields.includes(element)) newObj[element] = obj[element];
  });
  return newObj;
};

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (request, response, next) => {
  if (!request.file) return next();

  request.file.filename = `user-${request.user.id}-${Date.now()}.jpg`;

  await sharp(request.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({
      quality: 90,
    })
    .toFile(`public/img/users/${request.file.filename}`);
  next();
});

exports.updateMe = catchAsync(async (request, response, next) => {
  // 1) Error if user POST password data
  if (
    request.body.password ||
    request.body.passwordConfirm ||
    request.body.passwordCurrent ||
    request.body.newPassword ||
    request.body.newPasswordConfirm
  ) {
    return next(
      new AppError(
        'This route does not supports password update, Please use /changePassword',
        400
      )
    );
  }
  // 2) Update User document
  const filteredBody = filterObj(request.body, 'name', 'email');
  if (request.file) filteredBody.photo = request.file.filename;
  const updatedUser = await User.findByIdAndUpdate(
    request.user.id,
    filteredBody,
    {
      new: true,
      runValidators: true,
    }
  );

  response.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
  next();
});

exports.deleteMe = catchAsync(async (request, response, next) => {
  await User.findByIdAndUpdate(request.user.id, { active: false });

  response.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (request, response) => {
  response.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

exports.getMe = (request, response, next) => {
  request.params.id = request.user.id;
  next();
};
exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
