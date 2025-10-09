const receivingReportModel = require('../models/receivingReportModel')

exports.listReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search, date_from, date_to } = req.query
    const data = await receivingReportModel.listReports({ status, search, date_from, date_to }, Number(page), Number(limit))
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

exports.getReport = async (req, res, next) => {
  try {
    const { id } = req.params
    const data = await receivingReportModel.getReportById(Number(id))
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

exports.createReport = async (req, res, next) => {
  try {
    const userId = req.user?.user_id || req.user?.id || null
    const report = await receivingReportModel.createReport(req.body || {}, userId)
    res.status(201).json({ success: true, data: report })
  } catch (err) {
    next(err)
  }
}

exports.updateReport = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user?.user_id || req.user?.id || null
    await receivingReportModel.updateReport(Number(id), req.body || {}, userId)
    const report = await receivingReportModel.getReportById(Number(id))
    res.json({ success: true, data: report })
  } catch (err) {
    next(err)
  }
}

exports.addItem = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user?.user_id || req.user?.id || null
    const item = await receivingReportModel.addItem(Number(id), req.body || {}, userId)
    res.status(201).json({ success: true, data: item })
  } catch (err) {
    next(err)
  }
}

exports.updateItem = async (req, res, next) => {
  try {
    const { id, itemId } = req.params
    const userId = req.user?.user_id || req.user?.id || null
    const item = await receivingReportModel.updateItem(Number(itemId), req.body || {}, userId)
    res.json({ success: true, data: item })
  } catch (err) {
    next(err)
  }
}

exports.completeReport = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user?.user_id || req.user?.id || null
    const data = await receivingReportModel.completeReport(Number(id), userId)
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

exports.cancelReport = async (req, res, next) => {
  try {
    const { id } = req.params
    const { reason } = req.body || {}
    const userId = req.user?.user_id || req.user?.id || null
    const data = await receivingReportModel.cancelReport(Number(id), userId, reason)
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}
