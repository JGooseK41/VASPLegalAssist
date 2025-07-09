const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a new VASP submission
const createSubmission = async (req, res) => {
  try {
    const submission = await prisma.vaspSubmission.create({
      data: {
        userId: req.userId,
        name: req.body.name,
        legal_name: req.body.legal_name,
        jurisdiction: req.body.jurisdiction,
        compliance_email: req.body.compliance_email,
        compliance_contact: req.body.compliance_contact,
        service_address: req.body.service_address,
        phone: req.body.phone,
        processing_time: req.body.processing_time || '5-10 business days',
        preferred_method: req.body.preferred_method,
        required_document: req.body.required_document,
        info_types: req.body.info_types || ['KYC', 'Transaction History'],
        service_types: req.body.service_types || [],
        accepts_us_service: req.body.accepts_us_service || false,
        has_own_portal: req.body.has_own_portal || false,
        law_enforcement_url: req.body.law_enforcement_url,
        notes: req.body.notes
      }
    });
    
    res.status(201).json({
      message: 'VASP submission created successfully. It will be reviewed by an admin.',
      submission
    });
  } catch (error) {
    console.error('Error creating submission:', error);
    res.status(500).json({ error: 'Failed to create submission' });
  }
};

// Get user's own submissions
const getMySubmissions = async (req, res) => {
  try {
    const submissions = await prisma.vaspSubmission.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
};

// Get a specific submission (only if owned by user)
const getSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    const submission = await prisma.vaspSubmission.findFirst({
      where: {
        id: submissionId,
        userId: req.userId
      }
    });
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    res.json(submission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
};

// Update a pending submission
const updateSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    // Check if submission exists and is owned by user
    const existingSubmission = await prisma.vaspSubmission.findFirst({
      where: {
        id: submissionId,
        userId: req.userId,
        status: 'PENDING'
      }
    });
    
    if (!existingSubmission) {
      return res.status(404).json({ error: 'Submission not found or cannot be edited' });
    }
    
    const updatedSubmission = await prisma.vaspSubmission.update({
      where: { id: submissionId },
      data: {
        name: req.body.name,
        legal_name: req.body.legal_name,
        jurisdiction: req.body.jurisdiction,
        compliance_email: req.body.compliance_email,
        compliance_contact: req.body.compliance_contact,
        service_address: req.body.service_address,
        phone: req.body.phone,
        processing_time: req.body.processing_time,
        preferred_method: req.body.preferred_method,
        required_document: req.body.required_document,
        info_types: req.body.info_types,
        service_types: req.body.service_types || [],
        accepts_us_service: req.body.accepts_us_service,
        has_own_portal: req.body.has_own_portal,
        law_enforcement_url: req.body.law_enforcement_url,
        notes: req.body.notes
      }
    });
    
    res.json({
      message: 'Submission updated successfully',
      submission: updatedSubmission
    });
  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ error: 'Failed to update submission' });
  }
};

// Delete a pending submission
const deleteSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    // Check if submission exists and is owned by user
    const submission = await prisma.vaspSubmission.findFirst({
      where: {
        id: submissionId,
        userId: req.userId,
        status: 'PENDING'
      }
    });
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found or cannot be deleted' });
    }
    
    await prisma.vaspSubmission.delete({
      where: { id: submissionId }
    });
    
    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ error: 'Failed to delete submission' });
  }
};

module.exports = {
  createSubmission,
  getMySubmissions,
  getSubmission,
  updateSubmission,
  deleteSubmission
};