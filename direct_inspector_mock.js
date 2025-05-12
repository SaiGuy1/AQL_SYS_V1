// Paste this entire script into your browser console and press Enter

// This script directly injects mock inspector jobs into the application without relying on localStorage
(function injectMockInspectorJobs() {
  console.log("Directly injecting mock inspector jobs into the application...");

  // Create mock inspector jobs
  const mockJobs = [
    {
      id: "inspector-job-1",
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
      id: "inspector-job-2",
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
      id: "inspector-job-3",
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

  // Function to find the InspectorView component and inject mock jobs
  function findAndInjectIntoInspectorView() {
    // Look for React components in the page
    const reactInstances = [];
    const rootElems = document.querySelectorAll('[data-reactroot]');
    
    if (rootElems.length > 0) {
      console.log("Found React root elements:", rootElems.length);
    } else {
      console.log("No React root elements found, checking React DevTools...");
    }
    
    // Try to monkey patch the fetchJobs function in aqlService
    try {
      // First try to find the aqlService module in the global scope
      let aqlService = null;
      
      // Look for the fetchJobs function in window objects
      for (const key in window) {
        try {
          if (typeof window[key] === 'object' && window[key] !== null) {
            if (typeof window[key].fetchJobs === 'function') {
              aqlService = window[key];
              console.log("Found aqlService module:", key);
              break;
            }
          }
        } catch (e) {
          // Ignore errors accessing properties
        }
      }
      
      if (!aqlService) {
        // If not found in global scope, try to monkey patch it through require
        console.log("Attempting to patch through React components...");
        
        // Add the mock jobs directly to the page
        const jobsContainerDiv = document.createElement('div');
        jobsContainerDiv.id = 'mock-inspector-jobs-container';
        jobsContainerDiv.style.display = 'none';
        jobsContainerDiv.setAttribute('data-mock-jobs', JSON.stringify(mockJobs));
        document.body.appendChild(jobsContainerDiv);
        
        // Add script to override the fetchJobs function
        const injectScript = document.createElement('script');
        injectScript.textContent = `
          // Override the fetchJobs function
          (function() {
            console.log("Setting up fetchJobs override...");
            
            // Store the original fetchJobs if we can find it
            let originalFetchJobs = null;
            
            // Function to get mock jobs
            function getMockJobs() {
              const container = document.getElementById('mock-inspector-jobs-container');
              if (container) {
                try {
                  return JSON.parse(container.getAttribute('data-mock-jobs') || '[]');
                } catch (e) {
                  console.error("Error parsing mock jobs:", e);
                  return [];
                }
              }
              return [];
            }
            
            // Create a proxy for the window object to intercept module loading
            const originalDefineProperty = Object.defineProperty;
            
            Object.defineProperty = function(obj, prop, descriptor) {
              // Call the original method first
              const result = originalDefineProperty(obj, prop, descriptor);
              
              // Check if this is a module with fetchJobs
              if (
                descriptor && 
                descriptor.value && 
                typeof descriptor.value === 'object' && 
                typeof descriptor.value.fetchJobs === 'function'
              ) {
                console.log("Found fetchJobs in module:", prop);
                
                // Save original function
                originalFetchJobs = descriptor.value.fetchJobs;
                
                // Override the fetchJobs function
                descriptor.value.fetchJobs = async function() {
                  console.log("Intercepted fetchJobs call, returning mock jobs");
                  // Return mock jobs
                  return getMockJobs();
                };
                
                console.log("Successfully overrode fetchJobs function");
              }
              
              return result;
            };
            
            // Also try to find any existing React component that might be the InspectorView
            setTimeout(() => {
              console.log("Scanning for InspectorView component...");
              // Look for job list containers
              const possibleJobsContainers = [
                ...document.querySelectorAll('[class*="job"], [class*="Job"]'),
                ...document.querySelectorAll('[id*="job"], [id*="Job"]'),
                ...document.querySelectorAll('table'),
                ...document.querySelectorAll('[role="table"]')
              ];
              
              if (possibleJobsContainers.length > 0) {
                console.log("Found possible job containers:", possibleJobsContainers.length);
                
                // If we found containers but they're empty, try to trigger a refresh/reload
                const emptyContainers = Array.from(possibleJobsContainers).filter(
                  el => el.children.length === 0 || 
                       (el.textContent || '').includes('No jobs found') ||
                       (el.textContent || '').includes('No data')
                );
                
                if (emptyContainers.length > 0) {
                  console.log("Found empty job containers, trying to trigger refresh");
                  
                  // Look for refresh/reload buttons
                  const refreshButtons = [
                    ...document.querySelectorAll('button[title*="refresh" i], button[aria-label*="refresh" i]'),
                    ...document.querySelectorAll('button > svg[class*="refresh" i]').map(svg => svg.closest('button')),
                    ...document.querySelectorAll('[class*="refresh" i]')
                  ].filter(Boolean);
                  
                  if (refreshButtons.length > 0) {
                    console.log("Found refresh buttons, clicking first one");
                    refreshButtons[0].click();
                  }
                }
              }
            }, 1000);
          })();
        `;
        document.head.appendChild(injectScript);
      } else {
        // Direct override of the fetchJobs function
        console.log("Directly overriding fetchJobs function");
        const originalFetchJobs = aqlService.fetchJobs;
        
        aqlService.fetchJobs = async function() {
          console.log("Intercepted fetchJobs call, returning mock jobs");
          return mockJobs;
        };
        
        console.log("Successfully overrode fetchJobs function directly");
        
        // Try to trigger a refresh if the view is already rendered
        console.log("Attempting to trigger a UI refresh...");
        
        // Look for refresh buttons or job list containers
        const refreshButtons = [
          ...document.querySelectorAll('button[title*="refresh" i], button[aria-label*="refresh" i]'),
          ...document.querySelectorAll('button > svg[class*="refresh" i]').map(svg => svg.closest('button')),
          ...document.querySelectorAll('[class*="refresh" i]')
        ].filter(Boolean);
        
        if (refreshButtons.length > 0) {
          console.log("Found refresh buttons, clicking first one");
          refreshButtons[0].click();
        }
      }
    } catch (e) {
      console.error("Error overriding fetchJobs:", e);
    }
    
    // Backup approach: Also store in localStorage
    console.log("Storing mock jobs in localStorage as backup");
    localStorage.setItem("jobs", JSON.stringify(mockJobs));
    
    // Return success message
    return "Added 3 mock inspector jobs directly to the application. Try refreshing or navigating to the inspector view.";
  }
  
  // Execute the injection
  return findAndInjectIntoInspectorView();
})(); 