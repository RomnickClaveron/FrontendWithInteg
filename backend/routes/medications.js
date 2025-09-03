const express = require('express');
const { body, validationResult } = require('express-validator');
const MedicationSchedule = require('../models/MedicationSchedule');
const { auth, requireElder, requireAdminOrCaregiver } = require('../middleware/auth');

const router = express.Router();

// Create new medication schedule
router.post('/schedules', auth, requireElder, [
  body('medicationName').trim().isLength({ min: 1 }).withMessage('Medication name is required'),
  body('dosage').trim().isLength({ min: 1 }).withMessage('Dosage is required'),
  body('frequency').isIn(['daily', 'twice_daily', 'thrice_daily', 'weekly', 'custom']).withMessage('Valid frequency is required'),
  body('timeSlots').isArray({ min: 1 }).withMessage('At least one time slot is required'),
  body('timeSlots.*.time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format (HH:MM) is required'),
  body('daysOfWeek').optional().isArray().withMessage('Days of week must be an array'),
  body('startDate').optional().isISO8601().withMessage('Valid start date is required'),
  body('endDate').optional().isISO8601().withMessage('Valid end date is required'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      medicationName,
      dosage,
      frequency,
      timeSlots,
      daysOfWeek,
      startDate,
      endDate,
      notes
    } = req.body;

    const schedule = new MedicationSchedule({
      userId: req.user.userId,
      medicationName,
      dosage,
      frequency,
      timeSlots,
      daysOfWeek: daysOfWeek || [0, 1, 2, 3, 4, 5, 6], // All days by default
      startDate: startDate || new Date(),
      endDate: endDate || null,
      notes: notes || '',
      createdBy: req.user.userId
    });

    await schedule.save();

    res.status(201).json({
      success: true,
      message: 'Medication schedule created successfully',
      schedule: {
        id: schedule._id,
        userId: schedule.userId,
        medicationName: schedule.medicationName,
        dosage: schedule.dosage,
        frequency: schedule.frequency,
        timeSlots: schedule.timeSlots,
        daysOfWeek: schedule.daysOfWeek,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        isActive: schedule.isActive,
        notes: schedule.notes,
        createdAt: schedule.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating medication schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating medication schedule'
    });
  }
});

// Get medication schedules for a user
router.get('/schedules', auth, async (req, res) => {
  try {
    const { userId, status = 'active', page = 1, limit = 10 } = req.query;
    
    // Determine which user's schedules to fetch
    let targetUserId = req.user.userId;
    
    // If admin/caregiver is requesting specific user's schedules
    if (userId && (req.user.role === 1 || req.user.role === 3)) {
      targetUserId = userId;
    }
    
    let query = { userId: targetUserId };
    
    // Filter by status
    if (status === 'active') {
      query.isActive = true;
      query.$or = [
        { endDate: null },
        { endDate: { $gt: new Date() } }
      ];
    } else if (status === 'inactive') {
      query.isActive = false;
    } else if (status === 'expired') {
      query.endDate = { $lt: new Date() };
    }
    
    const skip = (page - 1) * limit;
    
    const schedules = await MedicationSchedule.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await MedicationSchedule.countDocuments(query);
    
    res.json({
      success: true,
      schedules: schedules.map(schedule => ({
        id: schedule._id,
        userId: schedule.userId,
        medicationName: schedule.medicationName,
        dosage: schedule.dosage,
        frequency: schedule.frequency,
        timeSlots: schedule.timeSlots,
        daysOfWeek: schedule.daysOfWeek,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        isActive: schedule.isActive,
        notes: schedule.notes,
        status: schedule.status,
        nextDoseTime: schedule.getNextDoseTime(),
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalSchedules: total,
        hasNext: skip + schedules.length < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching medication schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching medication schedules'
    });
  }
});

// Get specific medication schedule
router.get('/schedules/:scheduleId', auth, async (req, res) => {
  try {
    const { scheduleId } = req.params;
    
    const schedule = await MedicationSchedule.findById(scheduleId);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Medication schedule not found'
      });
    }
    
    // Check if user has permission to view this schedule
    if (schedule.userId !== req.user.userId && req.user.role !== 1) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own schedules.'
      });
    }
    
    res.json({
      success: true,
      schedule: {
        id: schedule._id,
        userId: schedule.userId,
        medicationName: schedule.medicationName,
        dosage: schedule.dosage,
        frequency: schedule.frequency,
        timeSlots: schedule.timeSlots,
        daysOfWeek: schedule.daysOfWeek,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        isActive: schedule.isActive,
        notes: schedule.notes,
        status: schedule.status,
        nextDoseTime: schedule.getNextDoseTime(),
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt
      }
    });

  } catch (error) {
    console.error('Error fetching medication schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching medication schedule'
    });
  }
});

// Update medication schedule
router.put('/schedules/:scheduleId', auth, requireElder, [
  body('medicationName').optional().trim().isLength({ min: 1 }).withMessage('Medication name is required'),
  body('dosage').optional().trim().isLength({ min: 1 }).withMessage('Dosage is required'),
  body('frequency').optional().isIn(['daily', 'twice_daily', 'thrice_daily', 'weekly', 'custom']).withMessage('Valid frequency is required'),
  body('timeSlots').optional().isArray({ min: 1 }).withMessage('At least one time slot is required'),
  body('timeSlots.*.time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format (HH:MM) is required'),
  body('daysOfWeek').optional().isArray().withMessage('Days of week must be an array'),
  body('startDate').optional().isISO8601().withMessage('Valid start date is required'),
  body('endDate').optional().isISO8601().withMessage('Valid end date is required'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { scheduleId } = req.params;
    const updates = req.body;
    
    // Add lastModifiedBy
    updates.lastModifiedBy = req.user.userId;
    
    const schedule = await MedicationSchedule.findOneAndUpdate(
      { _id: scheduleId, userId: req.user.userId },
      updates,
      { new: true, runValidators: true }
    );
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Medication schedule not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Medication schedule updated successfully',
      schedule: {
        id: schedule._id,
        userId: schedule.userId,
        medicationName: schedule.medicationName,
        dosage: schedule.dosage,
        frequency: schedule.frequency,
        timeSlots: schedule.timeSlots,
        daysOfWeek: schedule.daysOfWeek,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        isActive: schedule.isActive,
        notes: schedule.notes,
        status: schedule.status,
        nextDoseTime: schedule.getNextDoseTime(),
        updatedAt: schedule.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating medication schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating medication schedule'
    });
  }
});

// Delete medication schedule
router.delete('/schedules/:scheduleId', auth, requireElder, async (req, res) => {
  try {
    const { scheduleId } = req.params;
    
    const schedule = await MedicationSchedule.findOneAndDelete({
      _id: scheduleId,
      userId: req.user.userId
    });
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Medication schedule not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Medication schedule deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting medication schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting medication schedule'
    });
  }
});

module.exports = router;




