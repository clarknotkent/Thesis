// Import the default exported model object so its methods are directly accessible.
// Previous import used `* as` which wraps the default export under `.default`, causing
// `receivingReportModel.listReports is not a function` at runtime.
import receivingReportModel from '../models/receivingReportModel.js';

const listReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search, date_from, date_to } = req.query;
    const data = await receivingReportModel.listReports({ status, search, date_from, date_to }, Number(page), Number(limit));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await receivingReportModel.getReportById(Number(id));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const createReport = async (req, res, next) => {
  try {
    const userId = req.user?.user_id || req.user?.id || null;
    const report = await receivingReportModel.createReport(req.body || {}, userId);
    res.status(201).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

const updateReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.user_id || req.user?.id || null;
    await receivingReportModel.updateReport(Number(id), req.body || {}, userId);
    const report = await receivingReportModel.getReportById(Number(id));
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

const addItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.user_id || req.user?.id || null;
    const item = await receivingReportModel.addItem(Number(id), req.body || {}, userId);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

const updateItem = async (req, res, next) => {
  try {
    const { id: _id, itemId } = req.params;
    const userId = req.user?.user_id || req.user?.id || null;
    const item = await receivingReportModel.updateItem(Number(itemId), req.body || {}, userId);
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

const completeReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.user_id || req.user?.id || null;
    const data = await receivingReportModel.completeReport(Number(id), userId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const cancelReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const userId = req.user?.user_id || req.user?.id || null;
    const data = await receivingReportModel.cancelReport(Number(id), userId, reason);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export {
  listReports,
  getReport,
  createReport,
  updateReport,
  addItem,
  updateItem,
  completeReport,
  cancelReport
};
