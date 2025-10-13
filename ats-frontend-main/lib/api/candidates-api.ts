// API service for candidates matching endpoints
const BASE_URL = 'http://localhost:8002';

// Helper function to get company ID from localStorage
const getCompanyId = (): number | null => {
  if (typeof window === 'undefined') return null;
  const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
  return user?.companyId || null;
};

export interface CandidateMatch {
  candidate_id: number;
  job_id: number;
  candidate_name: string;
  candidate_email: string;
  experience: string;
  skills: string[];
  location: string;
  skills_matched_score: {
    score: number;
    explanation: string;
  };
  experience_score: {
    score: number;
    explanation: string;
  };
  overall_score: {
    score: number;
    explanation: string;
    fit_status: string;
  };
  parsed_url: string;
  resume_download_url: string;
  job_details_url: string;
  candidate_data: {
    Name: string;
    Email: string;
    Phone?: string;
    GitHub?: string;
    Skills: string[];
    Location: string;
    Projects?: Array<{
      Name: string;
      Description: string;
      Technologies: string[];
    }>;
    Education?: Array<{
      Year: string;
      Field?: string;
      Degree: string;
      Institution: string;
    }>;
    Languages?: string[];
    Experience?: Array<{
      Company: string;
      Duration: string;
      Position: string;
      Description: string;
    }>;
    Certifications?: string[];
    TotalExperience: string;
  };
}

export interface CandidatesResponse {
  success: boolean;
  job_id: number;
  job_title: string;
  company: string;
  experience_level: string;
  skills: string;
  location: string;
  total_candidates: number;
  min_score_threshold: number;
  candidates: CandidateMatch[];
  debug_info: {
    matching_method: string;
    resumes_checked: number;
    min_score_threshold: number;
  };
  message: string;
}

export interface AllMatchesResponse {
  success: boolean;
  total_jobs: number;
  total_candidates: number;
  jobs: Array<{
    job_title: string;
    company: string;
    experience_level: string;
    skills: string;
    location: string;
    candidates_count: number;
    candidates: CandidateMatch[];
  }>;
  debug_info: {
    jobs_processed: number;
    resumes_checked: number;
    min_score_threshold: number;
    matching_method: string;
  };
}

/**
 * Get matching candidates for a specific job using fast embedding similarity
 * @param jobId - The job ID to get candidates for
 * @param minScore - Minimum match score threshold (default: 0.1)
 * @returns Promise<CandidatesResponse>
 */
export async function getCandidatesForJob(
  jobId: number,
  minScore: number = 0.1,
  companyId?: number
): Promise<CandidatesResponse> {
  try {
    const finalCompanyId = companyId || getCompanyId();
    
    // Get JWT token from localStorage
    const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
    const token = user?.token;

    // Debug: Check token
    console.log('🔍 API Debug:');
    console.log('user:', user);
    console.log('token:', token);
    console.log('token length:', token?.length);

    if (!token) {
      console.error('❌ No JWT token found in localStorage');
      throw new Error('Authentication required. Please login again.');
    }

    const url = new URL(`${BASE_URL}/api/v1/candidates-matching/candidates-matching/job/${jobId}/candidates-fast`);
    url.searchParams.set('min_score', minScore.toString());
    if (finalCompanyId) {
      url.searchParams.set('company_id', finalCompanyId.toString());
    }

    console.log('🚀 Making API request to:', url.toString());
    console.log('🔑 Headers:', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Company-ID': finalCompanyId?.toString() || '',
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Company-ID': finalCompanyId?.toString() || '',
      },
    });

    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        localStorage.removeItem("authenticated");
        localStorage.removeItem("auth_email");
        localStorage.removeItem("ats_user");
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      } else if (response.status === 403) {
        throw new Error('Access denied. You do not have permission to view candidates for this job.');
      }
      
      // Try to get the actual error message from the response
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // If we can't parse the error response, use the generic message
        console.warn('Could not parse error response:', e);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching candidates for job:', error);
    throw new Error(`Failed to fetch candidates for job ${jobId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all matched candidates across all jobs
 * @param minScore - Minimum match score threshold (default: 0.1)
 * @returns Promise<AllMatchesResponse>
 */
export async function getAllMatches(
  minScore: number = 0.1
): Promise<AllMatchesResponse> {
  try {
    const companyId = getCompanyId();
    
    // Get JWT token from localStorage
    const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
    const token = user?.token;

    if (!token) {
      throw new Error('Authentication required. Please login again.');
    }

    const url = new URL(`${BASE_URL}/api/v1/candidates-matching/all-matches`);
    url.searchParams.set('min_score', minScore.toString());
    if (companyId) {
      url.searchParams.set('company_id', companyId.toString());
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Company-ID': companyId?.toString() || '',
      },
    });

    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        localStorage.removeItem("authenticated");
        localStorage.removeItem("auth_email");
        localStorage.removeItem("ats_user");
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      } else if (response.status === 403) {
        throw new Error('Access denied. You do not have permission to view all matches.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching all matches:', error);
    throw new Error(`Failed to fetch all matches: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get job details by ID (if needed for additional job information)
 * @param jobId - The job ID
 * @returns Promise<any>
 */
export async function getJobById(jobId: number): Promise<any> {
  try {
    // Get JWT token and company ID from localStorage
    const user = JSON.parse(localStorage.getItem('ats_user') || 'null');
    const token = user?.token;
    const companyId = user?.companyId;

    if (!token) {
      throw new Error('Authentication required. Please login again.');
    }

    const response = await fetch(
      `${BASE_URL}/api/v1/jobs/${jobId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Company-ID': companyId?.toString() || '',
        },
      }
    );

    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        localStorage.removeItem("authenticated");
        localStorage.removeItem("auth_email");
        localStorage.removeItem("ats_user");
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      } else if (response.status === 403) {
        throw new Error('Access denied. You do not have permission to view this job.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching job details:', error);
    throw new Error(`Failed to fetch job details: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
