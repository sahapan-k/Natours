const catchAsync = require('../utility/catchAsync');
const AppError = require('../utility/appError');
const APIFeatures = require('../utility/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (request, response, next) => {
    const document = await Model.findByIdAndRemove(request.params.id);

    if (!document) {
      return next(new AppError('No document found with provided ID', 404));
    }

    response.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (request, response, next) => {
    const document = await Model.findByIdAndUpdate(
      request.params.id,
      request.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!Model) {
      return next(new AppError('No model found with provided ID', 404));
    }

    response.status(200).json({
      status: 'success',
      data: {
        data: document,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (request, response, next) => {
    const newDocument = await Model.create(request.body);
    response.status(201).json({
      status: 'success',
      data: {
        data: newDocument,
      },
    });
  });

exports.getOne = (Model, popOption) =>
  catchAsync(async (request, response, next) => {
    let query = Model.findById(request.params.id);
    if (popOption) query = query.populate(popOption);
    const document = await query;

    if (!document) {
      return next(new AppError('No tour found with provided ID', 404));
    }

    response.status(200).json({
      status: 'success',
      data: {
        data: document,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (request, response, next) => {
    let filter = {};
    if (request.params.tourId) filter = { tour: request.params.tourId };
    const features = new APIFeatures(Model.find(filter), request.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const document = await features.query;
    response.status(200).json({
      status: 'success',
      results: document.length,
      data: {
        data: document,
      },
    });
  });
