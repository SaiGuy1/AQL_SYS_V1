// This script adds mock jobs for the inspector view to localStorage
// Run this in your browser console when in demo mode

function addMockInspectorJobs() {
  console.log("Adding mock jobs for inspector view...");
  
  // Get existing jobs from localStorage or initialize empty array
  const existingJobsStr = localStorage.getItem("jobs") || "[]";
  let jobs = [];
  
  try {
    jobs = JSON.parse(existingJobsStr);
    if (!Array.isArray(jobs)) {
      console.warn("Jobs in localStorage is not an array. Resetting to empty array.");
      jobs = [];
    }
  } catch (error) {
    console.error("Error parsing jobs from localStorage:", error);
    jobs = [];
  }
  
  // Generate unique IDs for new jobs
  const generateId = () => `job-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  // Create mock inspector jobs with certification assessments
  const mockJobs = [
    {
      id: generateId(),
      title: "Automotive Door Panel Inspection",
      job_number: "LOC-101-1",
      status: "Assigned",
      priority: "High",
      customer: {
        id: "cust-ford",
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
      inspector_id: "insp-1",
      inspector: "John Smith",
      assignedTo: "insp-1",
      safetyRequirements: ["Safety Glasses", "Steel Toe Boots", "Hearing Protection"],
      defectGuidelines: "Any dent larger than 1mm is considered a defect. Scratches longer than 3mm must be reported.",
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
      estimatedHours: 4.5,
      isBatchJob: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: generateId(),
      title: "Engine Component Quality Check",
      job_number: "LOC-102-1",
      status: "Assigned",
      priority: "Medium",
      customer: {
        id: "cust-gm",
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
      inspector_id: "insp-2",
      inspector: "Maria Rodriguez",
      assignedTo: "insp-2",
      safetyRequirements: ["Safety Glasses", "Cut-resistant Gloves", "Steel Toe Boots"],
      defectGuidelines: "All engine components must meet exact specification tolerances. Any deviation exceeding 0.02mm is a critical defect.",
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
        },
        {
          question: "When inspecting aluminum components, which contaminant is most critical to identify?",
          options: ["Dust", "Oil residue", "Iron particles", "Plastic shavings"],
          correctAnswerIndex: 2
        }
      ],
      estimatedHours: 6.0,
      isBatchJob: false,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: generateId(),
      title: "Headlight Assembly Inspection",
      job_number: "LOC-103-1",
      status: "Assigned",
      priority: "Medium",
      customer: {
        id: "cust-toyota",
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
      inspector_id: "insp-3",
      inspector: "Robert Johnson",
      assignedTo: "insp-3",
      safetyRequirements: ["ESD Protection", "Safety Glasses", "Clean Gloves"],
      defectGuidelines: "Headlights must be free of moisture, cracks, and discoloration. LED functionality must be 100% operational.",
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
      estimatedHours: 3.5,
      isBatchJob: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  
  // Add new jobs to the existing array, avoiding duplicates
  const existingTitles = new Set(jobs.map(job => job.title));
  
  // Add only jobs that don't have the same title
  let addedCount = 0;
  for (const job of mockJobs) {
    if (!existingTitles.has(job.title)) {
      jobs.push(job);
      existingTitles.add(job.title);
      addedCount++;
    }
  }
  
  // Save back to localStorage
  localStorage.setItem("jobs", JSON.stringify(jobs));
  
  console.log(`✅ Successfully added ${addedCount} new inspector jobs to localStorage.`);
  console.log(`Total jobs in localStorage: ${jobs.length}`);
  
  return `Added ${addedCount} new mock inspector jobs with certification assessments.`;
}

// Run the function immediately
addMockInspectorJobs();

// Make the function available for future use
window.addMockInspectorJobs = addMockInspectorJobs; 