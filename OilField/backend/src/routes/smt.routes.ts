/**
 * SMT Verification Routes
 * Proxy routes for SMT verification service
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles SMT service proxying
 * - Open/Closed: Easy to extend with additional SMT endpoints
 */

import { Router, Request, Response } from 'express';

const router = Router();

const SMT_SERVICE_URL = 'https://verticalslice-smt-service-gvav8.ondigitalocean.app';

/**
 * SMT Service response type
 */
interface SMTServiceResponse {
  informal_text: string;
  formal_text: string;
  formalization_similarity: number;
  smt_lib_code: string;
  extraction_degradation: number;
  check_sat_result: string;
  model: string | null;
  unsat_core: string | null;
  solver_success: boolean;
  metrics: {
    formalization_attempts: number;
    final_formalization_similarity: number;
    formalization_time_seconds: number;
    extraction_attempts: number;
    final_extraction_degradation: number;
    extraction_time_seconds: number;
    validation_attempts: number;
    solver_execution_time_seconds: number;
    total_time_seconds: number;
    success: boolean;
  };
  passed_all_checks: boolean;
  requires_manual_review: boolean;
}

/**
 * Transformed response for frontend
 */
interface SMTVerificationResult {
  status: string;
  formal_code: string;
  solver_output: string;
  is_satisfiable: boolean;
  passed_all_checks: boolean;
  metrics: SMTServiceResponse['metrics'];
}

/**
 * POST /api/smt/verify
 * Proxy request to SMT verification service
 */
router.post('/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { informal_text } = req.body;

    if (!informal_text || typeof informal_text !== 'string') {
      res.status(400).json({ error: 'informal_text is required' });
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes

    const response = await fetch(`${SMT_SERVICE_URL}/pipeline/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ informal_text }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      res.status(response.status).json({
        error: `SMT service error: ${response.status}`,
        details: errorText
      });
      return;
    }

    const data = await response.json() as SMTServiceResponse;

    // Transform response to match frontend types
    const result: SMTVerificationResult = {
      status: data.solver_success ? 'success' : 'error',
      formal_code: data.smt_lib_code,
      solver_output: data.check_sat_result === 'sat'
        ? `Satisfiable\nModel: ${data.model || 'N/A'}`
        : `Unsatisfiable\nCore: ${data.unsat_core || 'N/A'}`,
      is_satisfiable: data.check_sat_result === 'sat',
      // Additional fields for debugging/display
      passed_all_checks: data.passed_all_checks,
      metrics: data.metrics,
    };

    res.json(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      res.status(504).json({ error: 'SMT service timeout' });
      return;
    }

    console.error('SMT proxy error:', error);
    res.status(500).json({
      error: 'Failed to verify with SMT service',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/smt/health
 * Check SMT service health
 */
router.get('/health', async (_req: Request, res: Response): Promise<void> => {
  try {
    const response = await fetch(`${SMT_SERVICE_URL}/health`, {
      method: 'GET',
    });

    if (response.ok) {
      res.json({ status: 'healthy' });
    } else {
      res.status(503).json({ status: 'unhealthy' });
    }
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
