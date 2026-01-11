/**
 * SMT (Satisfiability Modulo Theories) Verification Types
 * Types for interacting with the SMT verification service
 */

/**
 * Request body for SMT verification
 */
export interface SMTVerificationRequest {
  /**
   * Informal text containing constraints to verify
   */
  informal_text: string;
}

/**
 * Metrics from SMT verification pipeline
 */
export interface SMTMetrics {
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
}

/**
 * Response from SMT verification service
 */
export interface SMTVerificationResult {
  /**
   * Status of the verification (e.g., "success", "error")
   */
  status: string;

  /**
   * Generated formal SMT-LIB code
   */
  formal_code: string;

  /**
   * Raw output from the SMT solver
   */
  solver_output: string;

  /**
   * Whether the constraints are satisfiable
   */
  is_satisfiable: boolean;

  /**
   * Whether all quality checks passed
   */
  passed_all_checks?: boolean;

  /**
   * Pipeline metrics
   */
  metrics?: SMTMetrics;
}

/**
 * State for verification UI
 */
export interface VerificationState {
  /**
   * Whether verification is in progress
   */
  isVerifying: boolean;

  /**
   * Verification result if completed
   */
  result: SMTVerificationResult | null;

  /**
   * Error message if verification failed
   */
  error: string | null;
}

/**
 * Props for VerificationBadge component
 */
export interface VerificationBadgeProps {
  /**
   * Current verification state
   */
  state: VerificationState;

  /**
   * Optional className for styling
   */
  className?: string;
}

/**
 * Configuration for SMT service
 */
export interface SMTServiceConfig {
  /**
   * Base URL for SMT service
   */
  baseUrl: string;

  /**
   * Timeout in milliseconds
   */
  timeout: number;
}
