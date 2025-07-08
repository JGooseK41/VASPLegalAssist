// Example Cypress E2E Test Suite for VASP Records Assistant
// This demonstrates critical user journey testing

describe('VASP Records Assistant - Critical User Journeys', () => {
  // Test data
  const testUser = {
    email: 'test.user@prosecutor.gov',
    password: 'TestPassword123!',
    name: 'Test User'
  };

  const testCase = {
    caseNumber: '2024-CR-TEST-001',
    defendantName: 'John Test Doe',
    vaspName: 'Coinbase',
    dateRange: '01/01/2024 - 12/31/2024'
  };

  beforeEach(() => {
    // Reset application state
    cy.visit('/');
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  describe('Authentication Flow', () => {
    it('should register a new user successfully', () => {
      cy.visit('/register');
      
      // Fill registration form
      cy.get('[data-testid="email-input"]').type(testUser.email);
      cy.get('[data-testid="password-input"]').type(testUser.password);
      cy.get('[data-testid="confirm-password-input"]').type(testUser.password);
      cy.get('[data-testid="name-input"]').type(testUser.name);
      
      // Submit form
      cy.get('[data-testid="register-button"]').click();
      
      // Verify success
      cy.url().should('include', '/dashboard');
      cy.contains('Welcome to VASP Records Assistant').should('be.visible');
    });

    it('should handle registration errors gracefully', () => {
      cy.visit('/register');
      
      // Try to register with existing email
      cy.get('[data-testid="email-input"]').type('existing@user.com');
      cy.get('[data-testid="password-input"]').type(testUser.password);
      cy.get('[data-testid="confirm-password-input"]').type(testUser.password);
      cy.get('[data-testid="name-input"]').type(testUser.name);
      
      cy.get('[data-testid="register-button"]').click();
      
      // Verify error message
      cy.contains('Email already registered').should('be.visible');
    });

    it('should login successfully', () => {
      cy.visit('/login');
      
      cy.get('[data-testid="email-input"]').type(testUser.email);
      cy.get('[data-testid="password-input"]').type(testUser.password);
      cy.get('[data-testid="login-button"]').click();
      
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="user-menu"]').should('contain', testUser.name);
    });

    it('should handle password reset flow', () => {
      cy.visit('/forgot-password');
      
      cy.get('[data-testid="email-input"]').type(testUser.email);
      cy.get('[data-testid="reset-button"]').click();
      
      cy.contains('Password reset email sent').should('be.visible');
      
      // In real test, would need to intercept email or use test endpoint
      // cy.getPasswordResetLink(testUser.email).then((resetLink) => {
      //   cy.visit(resetLink);
      //   cy.get('[data-testid="new-password-input"]').type('NewPassword123!');
      //   cy.get('[data-testid="confirm-password-input"]').type('NewPassword123!');
      //   cy.get('[data-testid="submit-button"]').click();
      // });
    });
  });

  describe('Document Creation Flow', () => {
    beforeEach(() => {
      // Login before each test
      cy.login(testUser.email, testUser.password);
    });

    it('should create a simple document successfully', () => {
      cy.visit('/documents/create');
      
      // Select simple document
      cy.get('[data-testid="simple-document-card"]').click();
      
      // Fill form
      cy.get('[data-testid="case-number-input"]').type(testCase.caseNumber);
      cy.get('[data-testid="defendant-name-input"]').type(testCase.defendantName);
      
      // Search for VASP
      cy.get('[data-testid="vasp-search-button"]').click();
      cy.get('[data-testid="vasp-search-input"]').type(testCase.vaspName);
      cy.get('[data-testid="vasp-search-results"]')
        .contains(testCase.vaspName)
        .click();
      
      cy.get('[data-testid="date-range-input"]').type(testCase.dateRange);
      
      // Generate document
      cy.get('[data-testid="generate-button"]').click();
      
      // Wait for generation
      cy.get('[data-testid="loading-spinner"]', { timeout: 10000 }).should('not.exist');
      
      // Verify success
      cy.contains('Document generated successfully').should('be.visible');
      cy.get('[data-testid="download-button"]').should('be.visible');
    });

    it('should handle batch processing', () => {
      cy.visit('/documents/batch');
      
      // Upload CSV file
      const csvContent = `CaseNumber,DefendantName,VaspName,DateRange
${testCase.caseNumber},${testCase.defendantName},${testCase.vaspName},${testCase.dateRange}
2024-CR-TEST-002,Jane Test Doe,Kraken,02/01/2024 - 02/29/2024`;
      
      cy.get('[data-testid="csv-upload"]').attachFile({
        fileContent: csvContent,
        fileName: 'test-batch.csv',
        mimeType: 'text/csv'
      });
      
      // Select template
      cy.get('[data-testid="template-select"]').select('Default Subpoena');
      
      // Process batch
      cy.get('[data-testid="process-batch-button"]').click();
      
      // Monitor progress
      cy.get('[data-testid="batch-progress"]').should('be.visible');
      cy.get('[data-testid="batch-progress-bar"]').should('have.attr', 'aria-valuenow', '100');
      
      // Download results
      cy.get('[data-testid="download-all-button"]').click();
    });

    it('should validate required fields', () => {
      cy.visit('/documents/simple');
      
      // Try to generate without filling fields
      cy.get('[data-testid="generate-button"]').click();
      
      // Check validation messages
      cy.contains('Case number is required').should('be.visible');
      cy.contains('Defendant name is required').should('be.visible');
      cy.contains('VASP selection is required').should('be.visible');
    });
  });

  describe('Template Management', () => {
    beforeEach(() => {
      cy.login(testUser.email, testUser.password);
    });

    it('should upload and configure a template', () => {
      cy.visit('/templates');
      
      // Upload template
      cy.get('[data-testid="upload-template-button"]').click();
      cy.get('[data-testid="template-file-input"]').attachFile('test-template.docx');
      
      // Configure template
      cy.get('[data-testid="template-name-input"]').type('Custom Subpoena Template');
      cy.get('[data-testid="agency-header-input"]').type('Test District Attorney Office');
      cy.get('[data-testid="agency-address-input"]').type('123 Justice St, Law City, LC 12345');
      
      // Save template
      cy.get('[data-testid="save-template-button"]').click();
      
      // Verify success
      cy.contains('Template saved successfully').should('be.visible');
      cy.get('[data-testid="template-list"]').should('contain', 'Custom Subpoena Template');
    });

    it('should handle encryption toggle', () => {
      cy.visit('/templates');
      
      // Create encrypted template
      cy.get('[data-testid="new-template-button"]').click();
      cy.get('[data-testid="encryption-toggle"]').click();
      
      // Verify encryption indicator
      cy.get('[data-testid="encryption-status"]').should('contain', 'Encryption enabled');
    });
  });

  describe('VASP Search and Comments', () => {
    beforeEach(() => {
      cy.login(testUser.email, testUser.password);
    });

    it('should search for VASPs with filters', () => {
      cy.visit('/search');
      
      // Basic search
      cy.get('[data-testid="search-input"]').type('Coin');
      cy.get('[data-testid="search-button"]').click();
      
      // Verify results
      cy.get('[data-testid="search-results"]').should('be.visible');
      cy.get('[data-testid="result-item"]').should('have.length.greaterThan', 0);
      
      // Apply filters
      cy.get('[data-testid="filter-type"]').select('Exchange');
      cy.get('[data-testid="filter-state"]').select('California');
      
      // Verify filtered results
      cy.get('[data-testid="result-item"]').each(($el) => {
        cy.wrap($el).should('contain', 'Exchange');
        cy.wrap($el).should('contain', 'CA');
      });
    });

    it('should add and edit comments on VASP', () => {
      cy.visit('/search');
      
      // Search and select VASP
      cy.get('[data-testid="search-input"]').type('Coinbase');
      cy.get('[data-testid="search-button"]').click();
      cy.get('[data-testid="result-item"]').first().click();
      
      // Add comment
      cy.get('[data-testid="add-comment-button"]').click();
      cy.get('[data-testid="comment-input"]').type('Test comment for investigation');
      cy.get('[data-testid="save-comment-button"]').click();
      
      // Verify comment appears
      cy.get('[data-testid="comment-list"]').should('contain', 'Test comment for investigation');
      
      // Edit comment
      cy.get('[data-testid="edit-comment-button"]').first().click();
      cy.get('[data-testid="comment-input"]').clear().type('Updated comment');
      cy.get('[data-testid="save-comment-button"]').click();
      
      // Verify update
      cy.get('[data-testid="comment-list"]').should('contain', 'Updated comment');
    });
  });

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
      cy.login(testUser.email, testUser.password);
    });

    it('should navigate mobile menu', () => {
      cy.visit('/');
      
      // Open mobile menu
      cy.get('[data-testid="mobile-menu-button"]').click();
      
      // Check menu items
      cy.get('[data-testid="mobile-menu"]').should('be.visible');
      cy.get('[data-testid="mobile-menu"]').contains('Create Document').click();
      
      cy.url().should('include', '/documents/create');
    });

    it('should handle touch interactions', () => {
      cy.visit('/documents/simple');
      
      // Test dropdown on mobile
      cy.get('[data-testid="vasp-search-button"]').click();
      cy.get('[data-testid="vasp-dropdown"]').should('be.visible');
      
      // Simulate touch
      cy.get('[data-testid="vasp-dropdown-item"]').first().trigger('touchstart').trigger('touchend');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      cy.login(testUser.email, testUser.password);
      
      // Simulate network failure
      cy.intercept('POST', '/api/documents/generate', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('generateError');
      
      cy.visit('/documents/simple');
      cy.fillDocumentForm(testCase);
      cy.get('[data-testid="generate-button"]').click();
      
      cy.wait('@generateError');
      
      // Verify error handling
      cy.contains('Failed to generate document').should('be.visible');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });

    it('should handle session timeout', () => {
      cy.login(testUser.email, testUser.password);
      
      // Simulate session timeout
      cy.window().then((win) => {
        win.localStorage.removeItem('authToken');
      });
      
      // Try to perform action
      cy.visit('/documents/create');
      
      // Should redirect to login
      cy.url().should('include', '/login');
      cy.contains('Session expired. Please login again.').should('be.visible');
    });
  });

  describe('Performance Tests', () => {
    it('should load dashboard within 3 seconds', () => {
      cy.login(testUser.email, testUser.password);
      
      cy.visit('/', {
        onBeforeLoad: (win) => {
          win.performance.mark('start');
        },
        onLoad: (win) => {
          win.performance.mark('end');
          win.performance.measure('pageLoad', 'start', 'end');
          const measure = win.performance.getEntriesByName('pageLoad')[0];
          expect(measure.duration).to.be.lessThan(3000);
        }
      });
    });

    it('should handle large search results efficiently', () => {
      cy.login(testUser.email, testUser.password);
      cy.visit('/search');
      
      // Search that returns many results
      cy.get('[data-testid="search-input"]').type('a'); // Single letter to get many results
      cy.get('[data-testid="search-button"]').click();
      
      // Check that results load and pagination works
      cy.get('[data-testid="search-results"]', { timeout: 5000 }).should('be.visible');
      cy.get('[data-testid="pagination"]').should('be.visible');
      
      // Navigate pages
      cy.get('[data-testid="next-page"]').click();
      cy.get('[data-testid="page-indicator"]').should('contain', 'Page 2');
    });
  });
});

// Custom Commands
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type(email);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('include', '/dashboard');
  });
});

Cypress.Commands.add('fillDocumentForm', (data) => {
  cy.get('[data-testid="case-number-input"]').type(data.caseNumber);
  cy.get('[data-testid="defendant-name-input"]').type(data.defendantName);
  cy.get('[data-testid="vasp-search-button"]').click();
  cy.get('[data-testid="vasp-search-input"]').type(data.vaspName);
  cy.get('[data-testid="vasp-search-results"]').contains(data.vaspName).click();
  cy.get('[data-testid="date-range-input"]').type(data.dateRange);
});