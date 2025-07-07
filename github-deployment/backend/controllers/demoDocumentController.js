const pdfGenerator = require('../services/pdfGenerator');
const wordGenerator = require('../services/wordGenerator');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Generate document for demo users without saving to database
 * Returns the document data and URL but doesn't create a database record
 */
const generateDemoDocument = async (req, res) => {
  try {
    const {
      vaspId,
      vaspName,
      vaspJurisdiction,
      vaspEmail,
      vaspAddress,
      templateId,
      documentType,
      caseNumber,
      crimeDescription,
      statute,
      transactions,
      requestedInfo,
      outputFormat = 'pdf'
    } = req.body;

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    // Get template
    const template = templateId 
      ? await prisma.documentTemplate.findFirst({
          where: { id: templateId, userId: req.userId }
        })
      : await prisma.documentTemplate.findFirst({
          where: { userId: req.userId, templateType: documentType, isDefault: true }
        });

    if (!template) {
      return res.status(400).json({ error: 'No template found' });
    }

    // Prepare document data
    const documentData = {
      caseNumber,
      vaspName,
      vaspEmail,
      vaspAddress,
      vaspJurisdiction,
      investigatorName: `${user.firstName} ${user.lastName}`,
      agencyName: user.agencyName,
      badgeNumber: user.badgeNumber,
      statute,
      crimeDescription,
      transactions: transactions || [],
      requestedInfo: requestedInfo || []
    };

    let generatedDoc;
    let documentUrl;

    // Generate document based on output format and template type
    if (outputFormat === 'docx' && template.fileType === 'docx' && template.fileUrl) {
      // Generate Word document from smart template
      generatedDoc = await wordGenerator.generateFromSmartTemplate(
        template.id,
        req.userId,
        documentData
      );
      documentUrl = generatedDoc.url;
    } else {
      // Generate PDF (default behavior)
      generatedDoc = await pdfGenerator.generateDocument(
        documentData,
        template,
        documentType.toLowerCase()
      );
      documentUrl = generatedDoc.url;
    }

    // Return document data without saving to database
    res.status(200).json({
      message: 'Document generated successfully (not saved - demo account)',
      document: {
        id: `demo-${Date.now()}`, // Temporary ID for frontend
        userId: req.userId,
        vaspId: parseInt(vaspId),
        vaspName,
        vaspJurisdiction,
        vaspEmail,
        documentType,
        caseNumber,
        crimeDescription,
        statute,
        transactionDetails: JSON.stringify(transactions || []),
        requestedData: JSON.stringify(requestedInfo || []),
        pdfUrl: documentUrl,
        outputFormat: outputFormat,
        isDemo: true,
        createdAt: new Date()
      },
      documentUrl,
      outputFormat,
      filename: generatedDoc.filename,
      isDemo: true
    });
  } catch (error) {
    console.error('Generate demo document error:', error);
    res.status(500).json({ error: 'Failed to generate document' });
  }
};

module.exports = {
  generateDemoDocument
};