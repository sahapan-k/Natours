/* eslint-disable arrow-body-style */
const Tour = require('../models/tourModel');
const catchAsync = require('../utility/catchAsync');
const factory = require('./handleFactory');
const AppError = require('../utility/appError');
const sharp = require('sharp');
const multer = require('multer');
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

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (request, response, next) => {
  if (!request.files.imageCover || !request.files.images) return next();

  // 1 Cover image
  request.body.imageCover = `tour-${request.params.id}-${Date.now()}-cover.jpg`;
  await sharp(request.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({
      quality: 90,
    })
    .toFile(`public/img/tours/${request.body.imageCover}`);

  // 2 Images
  await Promise.all(
    request.files.images.map(async (file, index) => {
      request.body.images = [];
      const filename = `tour-${request.params.id}-${Date.now()}-${
        index + 1
      }.jpg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({
          quality: 90,
        })
        .toFile(`public/img/tours/${filename}`);
      request.body.images.push(filename);
    })
  );
  next();
});

exports.aliasTopTours = (request, _, next) => {
  request.query.limit = '5';
  request.query.sort = '-ratingAverage,price';
  request.query.fields = 'name,price,ratingAverage,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (request, response, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: '$difficulty',
        avgRating: { $avg: '$ratingsAverage' },
        numTours: { $sum: 1 },
        numRating: { $sum: '$ratingsQuantity' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);
  response.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (request, response, next) => {
  const year = Number(request.params.year);
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
  ]);

  response.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});

exports.getTourWithIn = catchAsync(async (request, response, next) => {
  const { distance, latlng, unit } = request.params;
  const [lat, lng] = latlng.split(',');
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400
      )
    );
  }
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  response.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistance = catchAsync(async (request, response, next) => {
  const { latlng, unit } = request.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400
      )
    );
  }

  const distance = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [Number(lng), Number(lat)],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  response.status(200).json({
    status: 'success',
    data: {
      data: distance,
    },
  });
});
