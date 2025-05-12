// Paste this entire script into your browser console and press Enter

// Simple script to add mock jobs with certification assessments to localStorage
(function addInspectorJobs() {
  console.log("Adding inspector jobs to localStorage...");
  
  // Generate a random ID for the jobs
  const randomId = () => Math.random().toString(36).substring(2, 10);
  
  // Create the mock jobs with certification assessments
  const mockJobs = [
    {
      id: "job-" + randomId(),
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
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "job-" + randomId(),
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
        }
      ],
      estimatedHours: 6.0,
      isBatchJob: false,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "job-" + randomId(),
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
  
  // Get existing jobs or initialize an empty array
  let existingJobs = [];
  try {
    const storedJobs = localStorage.getItem("jobs");
    existingJobs = storedJobs ? JSON.parse(storedJobs) : [];
    if (!Array.isArray(existingJobs)) existingJobs = [];
  } catch (e) {
    console.error("Error reading localStorage:", e);
    existingJobs = [];
  }
  
  // Add the new jobs
  const newJobs = [...existingJobs, ...mockJobs];
  localStorage.setItem("jobs", JSON.stringify(newJobs));
  
  console.log(`✅ Successfully added ${mockJobs.length} inspector jobs to localStorage!`);
  console.log(`Total jobs in localStorage: ${newJobs.length}`);
  console.log("Refresh the page to see the jobs in the inspector view.");
  
  // Return a success message
  return `Added ${mockJobs.length} inspector jobs to localStorage. Refresh the page to see them.`;
})(); 