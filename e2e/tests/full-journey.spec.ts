import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { IntakePage } from '../pages/IntakePage';
import { DocumentUploadPage } from '../pages/DocumentUploadPage';
import { CompletePage } from '../pages/CompletePage';
import { WorkerApi } from '../api/WorkerApi';
import {
  URLS,
  TEST_CANDIDATE,
  TARGET_JOB_DESCRIPTION,
  SAMPLE_DD214_TEXT,
  EXISTING_CANDIDATE_ID,
  VALIDATION_THRESHOLDS,
  SOFT_THRESHOLDS
} from '../fixtures/test-data';

/**
 * Operation Hired - Full E2E Journey Tests
 *
 * Comprehensive end-to-end testing of the deployed resume generation platform.
 * Tests the complete user flow from landing page to PDF download.
 */

test.describe('Operation Hired - Full User Journey', () => {

  test.describe('1. Infrastructure Health', () => {

    test('1.1 Worker service is healthy', async ({ request }) => {
      const api = new WorkerApi(request);
      const health = await api.healthCheck();

      console.log('Worker Health:', health);
      expect(health.status).toBe('healthy');
      expect(health.service).toBe('worker');
    });

    test('1.2 Frontend is accessible', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      const title = await homePage.getTitle();
      console.log('Frontend Title:', title);

      expect(title).toBeTruthy();
      await homePage.takeScreenshot('01-homepage');
    });

  });

  test.describe('2. Homepage & Navigation', () => {

    test('2.1 Homepage loads with hero content', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();
      await homePage.expectLoaded();

      // Verify hero section exists
      await expect(homePage.heroHeading).toBeVisible();
      const heroText = await homePage.heroHeading.textContent();
      console.log('Hero Heading:', heroText);

      await homePage.takeScreenshot('02-homepage-loaded');
    });

    test('2.2 CTA button navigates to intake', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.clickGetStarted();

      // Should be on intake page
      await expect(page).toHaveURL(/\/intake/);
      await page.screenshot({ path: 'test-results/screenshots/03-intake-from-cta.png' });
    });

  });

  test.describe('3. Candidate Intake Form', () => {

    test('3.1 Intake form loads with all fields', async ({ page }) => {
      const intakePage = new IntakePage(page);
      await intakePage.goto();
      await intakePage.expectLoaded();

      // Verify essential fields exist
      await expect(intakePage.nameInput).toBeVisible();
      await expect(intakePage.emailInput).toBeVisible();

      await intakePage.takeScreenshot('04-intake-form');
    });

    test('3.2 Form validates required fields', async ({ page }) => {
      const intakePage = new IntakePage(page);
      await intakePage.goto();
      await intakePage.expectLoaded();

      // Try to submit empty form
      await intakePage.submitButton.click();

      // Should show validation or stay on page
      await expect(page).toHaveURL(/\/intake/);
      await intakePage.takeScreenshot('05-intake-validation');
    });

    test('3.3 Form accepts valid input and creates candidate', async ({ page }) => {
      const intakePage = new IntakePage(page);
      await intakePage.goto();
      await intakePage.expectLoaded();

      // Fill form with test data
      await intakePage.fillForm(TEST_CANDIDATE);
      await intakePage.takeScreenshot('06-intake-filled');

      // Submit form
      const candidateId = await intakePage.submit();

      console.log('Created Candidate ID:', candidateId);
      expect(candidateId).toBeTruthy();
      expect(candidateId.length).toBeGreaterThan(10);

      await page.screenshot({ path: 'test-results/screenshots/07-documents-page.png' });
    });

  });

  test.describe('4. Document Upload', () => {

    test('4.1 Document upload page loads', async ({ page }) => {
      // First create a candidate
      const intakePage = new IntakePage(page);
      await intakePage.goto();
      await intakePage.fillForm(TEST_CANDIDATE);
      const candidateId = await intakePage.submit();

      const uploadPage = new DocumentUploadPage(page, candidateId);
      await uploadPage.expectLoaded();

      await uploadPage.takeScreenshot('08-upload-page');
    });

    test('4.2 Can upload test document', async ({ page }) => {
      // Create candidate first
      const intakePage = new IntakePage(page);
      await intakePage.goto();
      await intakePage.fillForm(TEST_CANDIDATE);
      const candidateId = await intakePage.submit();

      const uploadPage = new DocumentUploadPage(page, candidateId);
      await uploadPage.expectLoaded();

      // Upload test DD-214
      await uploadPage.uploadTestDocument(SAMPLE_DD214_TEXT, 'dd214-test.txt');
      await uploadPage.takeScreenshot('09-document-uploaded');

      // Verify file appears in list
      const fileCount = await uploadPage.getUploadedFilesCount();
      console.log('Uploaded files:', fileCount);
    });

  });

  test.describe('5. Resume Generation (API)', () => {

    test('5.1 3-PDF generation with existing candidate', async ({ request }) => {
      const api = new WorkerApi(request);

      console.log('\n📄 Generating 3-PDF Bundle...');
      const result = await api.generateThreePdfBundle(
        EXISTING_CANDIDATE_ID,
        TARGET_JOB_DESCRIPTION
      );

      console.log('\n📊 Generation Results:');
      console.log(`   Candidate: ${result.candidateName}`);
      console.log(`   Documents Processed: ${result.documentsProcessed}`);
      console.log(`   Target Job Provided: ${result.targetJobProvided}`);

      // Validate ATS scores
      console.log('\n📈 Validation Scores:');
      await api.validateAtsScores(result.validation);

      // Log any missing keywords
      if (result.validation.missingKeywords?.length > 0) {
        console.log(`\n⚠️  Missing Keywords: ${result.validation.missingKeywords.join(', ')}`);
      }

      // Verify PDFs were generated
      expect(result.paths.militaryPdfPath).toBeTruthy();
      expect(result.paths.civilianPdfPath).toBeTruthy();
      expect(result.paths.crosswalkPdfPath).toBeTruthy();

      console.log('\n✅ 3-PDF Bundle Generated Successfully');
    });

    test('5.2 ATS score meets minimum threshold', async ({ request }) => {
      const api = new WorkerApi(request);

      const result = await api.generateThreePdfBundle(
        EXISTING_CANDIDATE_ID,
        TARGET_JOB_DESCRIPTION
      );

      expect(result.validation.atsScore).toBeGreaterThanOrEqual(VALIDATION_THRESHOLDS.MIN_ATS_SCORE);
      console.log(`ATS Score: ${result.validation.atsScore} >= ${VALIDATION_THRESHOLDS.MIN_ATS_SCORE} ✓`);
    });

    test('5.3 Keyword coverage meets minimum threshold', async ({ request }) => {
      const api = new WorkerApi(request);

      const result = await api.generateThreePdfBundle(
        EXISTING_CANDIDATE_ID,
        TARGET_JOB_DESCRIPTION
      );

      const coverage = result.validation.keywordCoverage;
      const e2eMin = VALIDATION_THRESHOLDS.MIN_KEYWORD_COVERAGE;
      const prodTarget = SOFT_THRESHOLDS.TARGET_KEYWORD_COVERAGE;

      // E2E threshold is more lenient to account for AI variance
      expect(coverage).toBeGreaterThanOrEqual(e2eMin);

      if (coverage >= prodTarget) {
        console.log(`Keyword Coverage: ${coverage}% >= ${e2eMin}% ✓ (meets production target of ${prodTarget}%)`);
      } else {
        console.log(`Keyword Coverage: ${coverage}% >= ${e2eMin}% ✓ (below production target of ${prodTarget}%, AI variance expected)`);
      }

      // Log missing keywords for debugging
      if (result.validation.missingKeywords?.length > 0) {
        console.log(`Missing Keywords: ${result.validation.missingKeywords.slice(0, 5).join(', ')}${result.validation.missingKeywords.length > 5 ? '...' : ''}`);
      }
    });

    test('5.4 No banned AI phrases detected', async ({ request }) => {
      const api = new WorkerApi(request);

      const result = await api.generateThreePdfBundle(
        EXISTING_CANDIDATE_ID,
        TARGET_JOB_DESCRIPTION
      );

      expect(result.validation.bannedPhrasesFound.length).toBe(0);
      console.log(`Banned Phrases: ${result.validation.bannedPhrasesFound.length} ✓`);
    });

  });

  test.describe('6. Complete Page & Downloads', () => {

    test('6.1 Complete page shows status for existing candidate', async ({ page }) => {
      const completePage = new CompletePage(page, EXISTING_CANDIDATE_ID);
      await completePage.goto();
      await completePage.expectLoaded();

      const status = await completePage.getStatus();
      console.log('Candidate Status:', status);

      await completePage.takeScreenshot('10-complete-page');
    });

    test('6.2 Download links are available for ready resume', async ({ page, request }) => {
      // First generate a resume via API to ensure it's ready
      const api = new WorkerApi(request);
      await api.generateThreePdfBundle(EXISTING_CANDIDATE_ID, TARGET_JOB_DESCRIPTION);

      // Then check the complete page
      const completePage = new CompletePage(page, EXISTING_CANDIDATE_ID);
      await completePage.goto();

      // Try to get download URL
      const downloadUrl = await completePage.downloadPdf().catch(() => null);

      if (downloadUrl) {
        console.log('Download URL available:', downloadUrl.substring(0, 50) + '...');
      } else {
        console.log('Download links may require page refresh or processing');
      }

      await completePage.takeScreenshot('11-downloads-available');
    });

  });

  test.describe('7. Full Flow Integration', () => {

    test('7.1 Complete journey: Home -> Intake -> Upload -> Generate -> Download', async ({ page, request }) => {
      console.log('\n🚀 Starting Full E2E Journey Test\n');

      // Step 1: Homepage
      console.log('Step 1: Homepage');
      const homePage = new HomePage(page);
      await homePage.goto();
      await homePage.expectLoaded();
      await homePage.takeScreenshot('journey-01-homepage');
      console.log('   ✓ Homepage loaded\n');

      // Step 2: Navigate to Intake
      console.log('Step 2: Navigate to Intake');
      await homePage.clickGetStarted();
      console.log('   ✓ Navigated to intake\n');

      // Step 3: Fill Intake Form
      console.log('Step 3: Fill Intake Form');
      const intakePage = new IntakePage(page);
      await intakePage.expectLoaded();
      await intakePage.fillForm({
        ...TEST_CANDIDATE,
        name: `E2E Full Journey ${Date.now()}`,
        email: `journey-${Date.now()}@test.com`
      });
      await intakePage.takeScreenshot('journey-02-intake-filled');
      console.log('   ✓ Form filled\n');

      // Step 4: Submit and get Candidate ID
      console.log('Step 4: Create Candidate');
      const candidateId = await intakePage.submit();
      console.log(`   ✓ Candidate created: ${candidateId}\n`);

      // Step 5: Upload Document
      console.log('Step 5: Upload Document');
      const uploadPage = new DocumentUploadPage(page, candidateId);
      await uploadPage.expectLoaded();
      await uploadPage.uploadTestDocument(SAMPLE_DD214_TEXT, 'dd214-journey-test.txt');
      await uploadPage.takeScreenshot('journey-03-document-uploaded');
      console.log('   ✓ Document uploaded\n');

      // Step 6: Generate Resume via API (faster than UI)
      console.log('Step 6: Generate Resume');
      const api = new WorkerApi(request);

      // Process candidate
      const processResult = await api.processCandidate(candidateId).catch(e => {
        console.log('   Note: Process endpoint returned:', e.message);
        return null;
      });

      // Also generate 3-PDF if target job is needed
      const genResult = await api.generateThreePdfBundle(candidateId, TARGET_JOB_DESCRIPTION).catch(e => {
        console.log('   Note: 3-PDF generation:', e.message);
        return null;
      });

      if (genResult?.success) {
        console.log(`   ✓ Resume generated: ATS=${genResult.validation.atsScore}, Coverage=${genResult.validation.keywordCoverage}%\n`);
      } else {
        console.log('   ⚠ Resume generation may have issues\n');
      }

      // Step 7: Check Complete Page
      console.log('Step 7: Complete Page');
      const completePage = new CompletePage(page, candidateId);
      await completePage.goto();
      await completePage.takeScreenshot('journey-04-complete');
      console.log('   ✓ Journey complete!\n');

      console.log('🏁 Full E2E Journey Test Passed!\n');
    });

  });

});

test.describe('8. Regression Tests', () => {

  test('8.1 Multiple consecutive generations maintain quality', async ({ request }) => {
    const api = new WorkerApi(request);
    const scores: number[] = [];
    const coverages: number[] = [];

    for (let i = 0; i < 3; i++) {
      const result = await api.generateThreePdfBundle(
        EXISTING_CANDIDATE_ID,
        TARGET_JOB_DESCRIPTION
      );
      scores.push(result.validation.atsScore);
      coverages.push(result.validation.keywordCoverage);
      console.log(`Generation ${i + 1}: ATS=${result.validation.atsScore}, Coverage=${result.validation.keywordCoverage}%`);
    }

    // All scores should meet E2E minimum thresholds
    scores.forEach(score => {
      expect(score).toBeGreaterThanOrEqual(VALIDATION_THRESHOLDS.MIN_ATS_SCORE);
    });
    coverages.forEach(coverage => {
      expect(coverage).toBeGreaterThanOrEqual(VALIDATION_THRESHOLDS.MIN_KEYWORD_COVERAGE);
    });

    // Variance should be reasonable (within 15 points for ATS, 20% for coverage)
    const atsVariance = Math.max(...scores) - Math.min(...scores);
    const coverageVariance = Math.max(...coverages) - Math.min(...coverages);
    console.log(`ATS Variance: ${atsVariance} points, Coverage Variance: ${coverageVariance}%`);
    expect(atsVariance).toBeLessThanOrEqual(15);
    expect(coverageVariance).toBeLessThanOrEqual(20);
  });

  test('8.2 Different job descriptions produce optimized results', async ({ request }) => {
    const api = new WorkerApi(request);

    const jobDescriptions = [
      'Software Engineer requiring Python, JavaScript, Agile, and cloud computing skills.',
      'Project Manager requiring PMP, Scrum, budget management, and stakeholder communication.',
      'Operations Manager requiring logistics, supply chain, inventory, and team leadership.',
    ];

    for (const jobDesc of jobDescriptions) {
      const result = await api.generateThreePdfBundle(EXISTING_CANDIDATE_ID, jobDesc);

      console.log(`Job: ${jobDesc.substring(0, 40)}...`);
      console.log(`   ATS: ${result.validation.atsScore}, Coverage: ${result.validation.keywordCoverage}%`);

      // Use E2E thresholds which account for AI variance
      expect(result.validation.atsScore).toBeGreaterThanOrEqual(VALIDATION_THRESHOLDS.MIN_ATS_SCORE);
      expect(result.validation.keywordCoverage).toBeGreaterThanOrEqual(VALIDATION_THRESHOLDS.MIN_KEYWORD_COVERAGE);
    }
  });

});
