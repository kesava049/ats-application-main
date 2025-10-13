# Candidates Page - Job Selection Feature Fix

## 📋 **Summary**
Added job selection modal to the **Candidates page → Parsed Resumes tab**, matching the functionality already implemented in the **Bulk Import page**.

---

## 🎯 **What Was Changed**

### **File Modified:**
- `ats-frontend-main/app/components/enhanced-candidate-management.tsx`

---

## 🔧 **Changes Made**

### **1. Added New Imports**
```typescript
import NODE_API_URL from "../../NodeApi"
import { handleAuthError } from "../../lib/auth-error-handler"
import { DialogFooter } from "../../components/ui/dialog"
```

### **2. Added State Variables**
```typescript
// Job selection states
const [availableJobs, setAvailableJobs] = useState<any[]>([])
const [selectedJobForCandidate, setSelectedJobForCandidate] = useState<number | null>(null)
const [showJobSelectionModal, setShowJobSelectionModal] = useState(false)
const [pendingResumeId, setPendingResumeId] = useState<number | null>(null)
```

### **3. Added `fetchAvailableJobs()` Function**
Fetches all jobs from the Node.js backend to populate the job selection dropdown:
```typescript
async function fetchAvailableJobs() {
  // Fetches jobs from /api/jobs/get-jobs
  // Stores in availableJobs state
}
```

### **4. Added `initiateCreateCandidate()` Function**
Triggers the job selection modal:
```typescript
const initiateCreateCandidate = (resumeDataId: number) => {
  setPendingResumeId(resumeDataId)
  setSelectedJobForCandidate(null)
  setShowJobSelectionModal(true)
}
```

### **5. Updated `createCandidateFromResume()` Function**
- Changed signature from `async (resumeDataId: number, jobId?: number)` to `async ()`
- Now reads from `pendingResumeId` and `selectedJobForCandidate` state
- Passes `selectedJobForCandidate` to backend (can be `null` for general pool)
- Shows job name in success toast message
- Refreshes resume data after successful creation

### **6. Updated Button Click Handlers**
Changed from:
```typescript
onClick={() => createCandidateFromResume(resume.id)}
```

To:
```typescript
onClick={() => initiateCreateCandidate(resume.id)}
```

Updated in **2 places**:
1. Resume details dialog (larger button)
2. Table row actions (small icon button)

### **7. Added Job Selection Modal UI**
```tsx
<Dialog open={showJobSelectionModal} onOpenChange={setShowJobSelectionModal}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Select Job for Candidate</DialogTitle>
    </DialogHeader>
    <Select>
      {/* General Pool option */}
      <SelectItem value="null">General Pool (No specific job)</SelectItem>
      
      {/* All available jobs */}
      {availableJobs.map((job) => (
        <SelectItem key={job.id} value={job.id.toString()}>
          {job.title} • {job.city} • {job.jobType}
        </SelectItem>
      ))}
    </Select>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button onClick={createCandidateFromResume}>Add Candidate</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### **8. Integrated Job Fetching on Component Mount**
```typescript
useEffect(() => {
  fetchCandidates()
  fetchResumeData()
  fetchAvailableJobs()  // ← Added this line
}, [])
```

---

## 🎯 **How It Works Now**

### **User Flow:**
1. User navigates to **Candidates** → **Parsed Resumes** tab
2. Clicks **"+"** button on any parsed resume
3. **Job Selection Modal** appears with:
   - **General Pool (No specific job)** option
   - List of all active jobs with details
4. User selects a job or chooses "General Pool"
5. Clicks **"Add Candidate"**
6. Candidate is created with the selected job (or `null` for general pool)
7. Success toast shows which job the candidate was added to
8. Parsed resume is removed from the list
9. Candidate count increases

---

## ✅ **Features**

### **Job Selection:**
- ✅ **General Pool Option**: Add candidates without assigning to a specific job
- ✅ **Job List**: All active jobs displayed with title, city, and job type
- ✅ **Search-friendly**: Dropdown supports typing to filter jobs
- ✅ **Job Details**: Each job shows relevant information inline

### **Success Feedback:**
- ✅ Shows job name in toast: `"Candidate added to MERN Stack Developer"`
- ✅ Or: `"Candidate added to General Pool (No specific job)"`

### **Error Handling:**
- ✅ Auth errors (401/403) redirect to login
- ✅ Network errors show error toast
- ✅ Loading state on button during creation

---

## 🔄 **Consistency**

This implementation **matches exactly** the job selection feature in:
- `ats-frontend-main/app/components/bulk-import.tsx`

Both pages now have:
- ✅ Same UI/UX
- ✅ Same job selection modal
- ✅ Same API endpoint (`/api/jobs/get-jobs`)
- ✅ Same success/error handling
- ✅ Same general pool option

---

## 🧪 **Testing Guide**

### **1. Refresh the Browser**
```
Ctrl+R (Windows) or Cmd+R (Mac)
```

### **2. Navigate to Candidates Page**
```
Sidebar → Candidates
```

### **3. Switch to Parsed Resumes Tab**
```
Click: "Parsed Resumes (X)" tab
```

### **4. Click the "+" Button**
```
Click green "+" icon on any resume row
```

### **5. Verify Modal Appears**
```
✅ "Select Job for Candidate" modal opens
✅ Dropdown shows "General Pool" option
✅ Dropdown shows all your active jobs
```

### **6. Select a Job**
```
Click dropdown → Select any job
Click "Add Candidate"
```

### **7. Verify Success**
```
✅ Success toast appears with job name
✅ Resume disappears from "Parsed Resumes" tab
✅ Candidate count increases
✅ Switch to "Candidates (X)" tab to see new candidate
```

### **8. Test General Pool**
```
Repeat steps 4-6 but select "General Pool (No specific job)"
✅ Success toast: "Candidate added to General Pool (No specific job)"
✅ Candidate created with jobId = null
```

---

## 📊 **API Endpoints Used**

### **Fetch Jobs:**
```
GET /api/jobs/get-jobs?companyId={companyId}
Headers: Authorization: Bearer {token}
Response: { jobs: [...] }
```

### **Create Candidate:**
```
POST /api/candidates/create-from-resume
Headers: Authorization: Bearer {token}
Body: {
  resumeDataId: number,
  jobId: number | null
}
```

---

## 🔗 **Related Files**

- **Backend Controller**: `ats-node-main/controllers/candidateController.js`
  - `createCandidateFromResume()` function
- **Backend Routes**: `ats-node-main/routes/jobRoutes.js`
  - `/get-jobs` endpoint
- **Prisma Schema**: `ats-node-main/prisma/schema.prisma`
  - `CandidateApplication` model with optional `jobId`

---

## 🎉 **Result**

**Before Fix:**
- ❌ Clicking "+" would auto-assign to latest job (MERN Stack Developer)
- ❌ No control over job assignment
- ❌ Confusing user experience

**After Fix:**
- ✅ Modal appears with job selection
- ✅ User chooses which job to assign
- ✅ Option to add to general pool
- ✅ Clear feedback on which job was selected
- ✅ Consistent with Bulk Import page

---

## 🔍 **Key Technical Points**

1. **State Management**: Uses React state to manage modal visibility, pending resume, and selected job
2. **Authentication**: Integrates `handleAuthError` for automatic redirect on token expiry
3. **API Call**: Uses Node.js backend endpoint (not Python) for candidate creation
4. **Job Data**: Fetches jobs once on component mount for better performance
5. **User Feedback**: Shows specific job name in success toast
6. **Data Refresh**: Automatically refreshes parsed resumes list after creation

---

**Date:** October 13, 2025
**Status:** ✅ COMPLETED

