// Paste this entire script into your browser console and press Enter

// This script adds persistent mock inspector jobs that won't disappear on refresh
(function addPersistentInspectorJobs() {
  console.log("Adding persistent inspector jobs to localStorage...");
  
  // First, check if we've already added the jobs to avoid duplicates
  const JOBS_ADDED_FLAG = "inspector_jobs_added";
  if (localStorage.getItem(JOBS_ADDED_FLAG) === "true") {
    console.log("Inspector jobs already exist in localStorage. Checking jobs...");
    
    // Check if jobs are actually there
    const existingJobs = JSON.parse(localStorage.getItem("jobs") || "[]");
    if (existingJobs.length > 0) {
      console.log(`Found ${existingJobs.length} existing jobs in localStorage.`);
      let hasInspectorJobs = false;
      
      // Look for one of our inspector job titles
      for (const job of existingJobs) {
        if (job.title === "Automotive Door Panel Inspection" || 
            job.title === "Engine Component Quality Check" || 
            job.title === "Headlight Assembly Inspection") {
          hasInspectorJobs = true;
          break;
        }
      }
      
      if (hasInspectorJobs) {
        console.log("✅ Inspector jobs found in localStorage. No need to add them again.");
        return "Inspector jobs already exist in localStorage. No need to add more.";
      } else {
        console.log("No inspector jobs found despite flag. Will add them now.");
      }
    } else {
      console.log("Jobs array is empty despite flag. Will add inspector jobs now.");
    }
  }
  
  // Generate fixed IDs for better persistence
  const idPrefix = "inspector-job-";
  
  // Create the mock jobs with certification assessments
  const mockJobs = [
    {
      id: idPrefix + "1",
      title: "Automotive Door Panel Inspection",
      job_number: "LOC-101-1",
      status: "Assigned",
      priority: "High",
      customer: {
        name: "Ford Motors",
        email: "quality@ford.example.com",
        phone: "(313) 555-1234",
        company: "Ford Motor Company"
      },
      location: {
        address: "1 American Road, Dearborn, MI 48126",
        latitude: 42.3223,
        longitude: -83.2272
      },
      // Include both camelCase and lowercase versions of critical properties
      inspector_id: "insp-1",
      inspectorid: "insp-1",
      inspector: "John Smith",
      assignedTo: "insp-1",
      assignedto: "insp-1",
      safetyRequirements: ["Safety Glasses", "Steel Toe Boots", "Hearing Protection"],
      safety_requirements: ["Safety Glasses", "Steel Toe Boots", "Hearing Protection"],
      defectGuidelines: "Any dent larger than 1mm is considered a defect. Scratches longer than 3mm must be reported.",
      defect_guidelines: "Any dent larger than 1mm is considered a defect. Scratches longer than 3mm must be reported.",
      instructions: "Inspect door panels for proper fit, finish, and paint quality. Check for dents, scratches, and proper seal fitment.",
      certificationQuestions: [
        {
          question: "What is the minimum thickness requirement for automotive door panels?",
          options: ["0.5mm", "0.8mm", "1.2mm", "1.5mm"],
          correctAnswerIndex: 2
        },
        {
          question: "Which PPE is required when inspecting freshly painted panels?",
          options: ["Only gloves", "Safety glasses only", "Respirator and safety glasses", "No PPE required"],
          correctAnswerIndex: 2
        },
        {
          question: "What tool is used to measure paint thickness?",
          options: ["Caliper", "Paint depth gauge", "Micrometer", "Laser scanner"],
          correctAnswerIndex: 1
        }
      ],
      certification_questions: [
        {
          question: "What is the minimum thickness requirement for automotive door panels?",
          options: ["0.5mm", "0.8mm", "1.2mm", "1.5mm"],
          correctAnswerIndex: 2
        },
        {
          question: "Which PPE is required when inspecting freshly painted panels?",
          options: ["Only gloves", "Safety glasses only", "Respirator and safety glasses", "No PPE required"],
          correctAnswerIndex: 2
        },
        {
          question: "What tool is used to measure paint thickness?",
          options: ["Caliper", "Paint depth gauge", "Micrometer", "Laser scanner"],
          correctAnswerIndex: 1
        }
      ],
      estimatedHours: 4.5,
      estimated_hours: 4.5,
      isBatchJob: true,
      is_batch_job: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: idPrefix + "2",
      title: "Engine Component Quality Check",
      job_number: "LOC-102-1",
      status: "Assigned",
      priority: "Medium",
      customer: {
        name: "General Motors",
        email: "quality@gm.example.com",
        phone: "(313) 667-1020",
        company: "General Motors Corporation"
      },
      location: {
        address: "300 Renaissance Center, Detroit, MI 48243",
        latitude: 42.3293,
        longitude: -83.0398
      },
      // Include both camelCase and lowercase versions of critical properties
      inspector_id: "insp-2",
      inspectorid: "insp-2",
      inspector: "Maria Rodriguez",
      assignedTo: "insp-2",
      assignedto: "insp-2",
      safetyRequirements: ["Safety Glasses", "Cut-resistant Gloves", "Steel Toe Boots"],
      safety_requirements: ["Safety Glasses", "Cut-resistant Gloves", "Steel Toe Boots"],
      defectGuidelines: "All engine components must meet exact specification tolerances. Any deviation exceeding 0.02mm is a critical defect.",
      defect_guidelines: "All engine components must meet exact specification tolerances. Any deviation exceeding 0.02mm is a critical defect.",
      instructions: "Measure and inspect engine block components for dimensional accuracy. Check surface finish quality and thread integrity.",
      certificationQuestions: [
        {
          question: "What is the acceptable tolerance for engine cylinder dimensions?",
          options: ["±0.01mm", "±0.05mm", "±0.1mm", "±1mm"],
          correctAnswerIndex: 0
        },
        {
          question: "Which method is best for checking thread integrity?",
          options: ["Visual inspection only", "Go/No-Go gauge", "Caliper measurement", "Weight comparison"],
          correctAnswerIndex: 1
        },
        {
          question: "What surface finish parameter is most important for engine blocks?",
          options: ["Gloss level", "Ra value", "Color consistency", "Temperature resistance"],
          correctAnswerIndex: 1
        }
      ],
      certification_questions: [
        {
          question: "What is the acceptable tolerance for engine cylinder dimensions?",
          options: ["±0.01mm", "±0.05mm", "±0.1mm", "±1mm"],
          correctAnswerIndex: 0
        },
        {
          question: "Which method is best for checking thread integrity?",
          options: ["Visual inspection only", "Go/No-Go gauge", "Caliper measurement", "Weight comparison"],
          correctAnswerIndex: 1
        },
        {
          question: "What surface finish parameter is most important for engine blocks?",
          options: ["Gloss level", "Ra value", "Color consistency", "Temperature resistance"],
          correctAnswerIndex: 1
        }
      ],
      estimatedHours: 6.0,
      estimated_hours: 6.0,
      isBatchJob: false,
      is_batch_job: false,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: idPrefix + "3",
      title: "Headlight Assembly Inspection",
      job_number: "LOC-103-1",
      status: "Assigned",
      priority: "Medium",
      customer: {
        name: "Toyota USA",
        email: "quality@toyota.example.com",
        phone: "(859) 555-8989",
        company: "Toyota Motor Manufacturing"
      },
      location: {
        address: "25 Atlantic Avenue, Erlanger, KY 41018",
        latitude: 39.0253,
        longitude: -84.6051
      },
      // Include both camelCase and lowercase versions of critical properties
      inspector_id: "insp-3",
      inspectorid: "insp-3",
      inspector: "Robert Johnson",
      assignedTo: "insp-3",
      assignedto: "insp-3",
      safetyRequirements: ["ESD Protection", "Safety Glasses", "Clean Gloves"],
      safety_requirements: ["ESD Protection", "Safety Glasses", "Clean Gloves"],
      defectGuidelines: "Headlights must be free of moisture, cracks, and discoloration. LED functionality must be 100% operational.",
      defect_guidelines: "Headlights must be free of moisture, cracks, and discoloration. LED functionality must be 100% operational.",
      instructions: "Test light output and pattern. Check seals for proper installation. Verify electrical connections and light functionality.",
      certificationQuestions: [
        {
          question: "What should you check first when inspecting a sealed headlight assembly?",
          options: ["Light output", "Seal integrity", "Lens clarity", "Wire connections"],
          correctAnswerIndex: 1
        },
        {
          question: "What is the correct testing voltage for modern LED headlight assemblies?",
          options: ["5V", "12V", "24V", "It varies by manufacturer"],
          correctAnswerIndex: 3
        },
        {
          question: "What environmental test should be performed on headlight assemblies?",
          options: ["Heat cycle test", "Impact test", "Water submersion test", "All of the above"],
          correctAnswerIndex: 3
        }
      ],
      certification_questions: [
        {
          question: "What should you check first when inspecting a sealed headlight assembly?",
          options: ["Light output", "Seal integrity", "Lens clarity", "Wire connections"],
          correctAnswerIndex: 1
        },
        {
          question: "What is the correct testing voltage for modern LED headlight assemblies?",
          options: ["5V", "12V", "24V", "It varies by manufacturer"],
          correctAnswerIndex: 3
        },
        {
          question: "What environmental test should be performed on headlight assemblies?",
          options: ["Heat cycle test", "Impact test", "Water submersion test", "All of the above"],
          correctAnswerIndex: 3
        }
      ],
      estimatedHours: 3.5,
      estimated_hours: 3.5,
      isBatchJob: true,
      is_batch_job: true,
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  
  // Check if there are existing jobs in localStorage
  let existingJobs = [];
  try {
    const storedJobs = localStorage.getItem("jobs");
    existingJobs = storedJobs ? JSON.parse(storedJobs) : [];
    if (!Array.isArray(existingJobs)) {
      console.warn("Jobs in localStorage is not an array, resetting to empty array");
      existingJobs = [];
    }
  } catch (e) {
    console.error("Error reading localStorage:", e);
    existingJobs = [];
  }
  
  // Remove any existing inspector jobs (to avoid duplicates)
  const filteredJobs = existingJobs.filter(job => 
    !job.id?.startsWith(idPrefix) && 
    job.title !== "Automotive Door Panel Inspection" && 
    job.title !== "Engine Component Quality Check" && 
    job.title !== "Headlight Assembly Inspection"
  );
  
  // Add the new jobs
  const newJobs = [...filteredJobs, ...mockJobs];
  
  // Store both in localStorage and sessionStorage for maximum persistence
  try {
    localStorage.setItem("jobs", JSON.stringify(newJobs));
    sessionStorage.setItem("jobs", JSON.stringify(newJobs));
    localStorage.setItem(JOBS_ADDED_FLAG, "true");
    
    // Also store separately as a backup
    localStorage.setItem("inspector_jobs_backup", JSON.stringify(mockJobs));
    
    console.log(`✅ Successfully added ${mockJobs.length} inspector jobs to localStorage and sessionStorage!`);
    console.log(`Total jobs in storage: ${newJobs.length}`);
    console.log("Jobs should now persist after refresh.");
    
    // For extra persistence, create a one-time load interceptor
    const script = document.createElement('script');
    script.textContent = `
      // Check for jobs on page load
      window.addEventListener('load', function() {
        setTimeout(function() {
          console.log("Checking job persistence...");
          const jobs = JSON.parse(localStorage.getItem("jobs") || "[]");
          if (jobs.length === 0) {
            console.log("Jobs missing after refresh, restoring from backup...");
            const backup = JSON.parse(localStorage.getItem("inspector_jobs_backup") || "[]");
            if (backup.length > 0) {
              localStorage.setItem("jobs", JSON.stringify(backup));
              console.log("Restored jobs from backup");
            }
          }
        }, 1000);
      });
    `;
    document.head.appendChild(script);
  } catch (e) {
    console.error("Error saving to localStorage:", e);
    alert("Error saving jobs to localStorage. Your browser might have storage restrictions.");
  }
  
  // Return a success message
  return `Added ${mockJobs.length} inspector jobs with persistence. Refresh the page to verify they remain.`;
})(); 