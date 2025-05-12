export const mockJobs = [
  {
    id: '1',
    contractNumber: 'AQL-2023-001',
    customerName: 'Automotive Excellence Inc.',
    location: 'Detroit, MI',
    startDate: '2023-01-15',
    status: 'in-progress' as const,
    defects: 12,
    inspector: 'John Smith',
    shift: 'Morning',
    partName: 'Front Door Panel Assembly',
    pphv: 18.5,
    billingStatus: 'pending' as const,
    totalReviewed: 450,
    emergencyProcedures: 'Follow standard safety protocols.',
    emergencyFloorPlan: 'Available in the supervisor\'s office.'
  },
  {
    id: '2',
    contractNumber: 'AQL-2023-002',
    customerName: 'Global Motors',
    location: 'Chicago, IL',
    startDate: '2023-02-01',
    status: 'completed' as const,
    defects: 5,
    inspector: 'Sarah Johnson',
    shift: 'Afternoon',
    partName: 'Rear Seat Cushion Frame',
    pphv: 22.3,
    billingStatus: 'paid' as const,
    totalReviewed: 800,
    emergencyProcedures: 'Evacuate to the north parking lot.',
    emergencyFloorPlan: 'Posted near the time clock.'
  },
  {
    id: '3',
    contractNumber: 'AQL-2023-003',
    customerName: 'TechDrive Solutions',
    location: 'Austin, TX',
    startDate: '2023-02-15',
    status: 'on-hold' as const,
    defects: 18,
    inspector: 'Mike Williams',
    shift: 'Night',
    partName: 'Dashboard Instrument Panel',
    pphv: 15.7,
    billingStatus: 'billed' as const,
    totalReviewed: 320,
    emergencyProcedures: 'Contact security at extension 555.',
    emergencyFloorPlan: 'Contained in the employee handbook.'
  },
  {
    id: '4',
    contractNumber: 'AQL-2023-004',
    customerName: 'Precision Auto Parts',
    location: 'Detroit, MI',
    startDate: '2023-03-01',
    status: 'pending' as const,
    defects: 0,
    inspector: 'Emily Davis',
    shift: 'Morning',
    partName: 'Center Console Assembly',
    pphv: null,
    billingStatus: 'pending' as const,
    totalReviewed: 0,
    emergencyProcedures: 'Use the buddy system for assistance.',
    emergencyFloorPlan: 'Displayed on the company intranet.'
  },
  {
    id: '5',
    contractNumber: 'AQL-2023-005',
    customerName: 'Automotive Excellence Inc.',
    location: 'Toledo, OH',
    startDate: '2023-03-15',
    status: 'needs-review' as const,
    defects: 27,
    inspector: 'Robert Chen',
    shift: 'Afternoon',
    partName: 'Steering Wheel Trim Cover',
    pphv: 12.8,
    billingStatus: 'pending' as const,
    totalReviewed: 640,
    emergencyProcedures: 'Report any hazards to the supervisor.',
    emergencyFloorPlan: 'Available upon request from HR.'
  },
  {
    id: '6',
    contractNumber: 'AQL-2023-006',
    customerName: 'Global Motors',
    location: 'Chicago, IL',
    startDate: '2023-04-01',
    status: 'in-progress' as const,
    defects: 9,
    inspector: 'James Wilson',
    shift: 'Night',
    partName: 'Headrest Support Structure',
    pphv: 19.5,
    billingStatus: 'pending' as const,
    totalReviewed: 580,
    emergencyProcedures: 'Know the location of all fire extinguishers.',
    emergencyFloorPlan: 'Included in the new employee orientation packet.'
  },
  {
    id: '7',
    contractNumber: 'AQL-2023-007',
    customerName: 'TechDrive Solutions',
    location: 'Austin, TX',
    startDate: '2023-04-15',
    status: 'rejected' as const,
    defects: 32,
    inspector: 'Maria Lopez',
    shift: 'Morning',
    partName: 'Sunroof Control Module',
    pphv: 10.2,
    billingStatus: 'billed' as const,
    totalReviewed: 420,
    emergencyProcedures: 'Assist injured personnel if trained.',
    emergencyFloorPlan: 'Maintained by the facilities department.'
  },
  {
    id: '8',
    contractNumber: 'AQL-2023-008',
    customerName: 'Precision Auto Parts',
    location: 'Detroit, MI',
    startDate: '2023-05-01',
    status: 'in-progress' as const,
    defects: 14,
    inspector: 'David Kim',
    shift: 'Afternoon',
    partName: 'Door Handle Locking Mechanism',
    pphv: 17.9,
    billingStatus: 'pending' as const,
    totalReviewed: 510,
    emergencyProcedures: 'Do not return to work until cleared by a supervisor.',
    emergencyFloorPlan: 'Reviewed annually during safety training.'
  },
  {
    id: '9',
    contractNumber: 'AQL-2023-009',
    customerName: 'Automotive Excellence Inc.',
    location: 'Toledo, OH',
    startDate: '2023-05-15',
    status: 'completed' as const,
    defects: 6,
    inspector: 'Jessica Brown',
    shift: 'Night',
    partName: 'Glove Box Assembly',
    pphv: 23.1,
    billingStatus: 'paid' as const,
    totalReviewed: 720,
    emergencyProcedures: 'Secure all equipment before evacuating.',
    emergencyFloorPlan: 'Located in the break room.'
  },
  {
    id: '10',
    contractNumber: 'AQL-2023-010',
    customerName: 'Global Motors',
    location: 'Chicago, IL',
    startDate: '2023-06-01',
    status: 'in-progress' as const,
    defects: 19,
    inspector: 'Thomas Martin',
    shift: 'Morning',
    partName: 'Cup Holder Insert Component',
    pphv: 16.4,
    billingStatus: 'pending' as const,
    totalReviewed: 390,
    emergencyProcedures: 'Follow evacuation routes posted throughout the facility.',
    emergencyFloorPlan: 'Distributed to all employees upon hiring.'
  },
  {
    id: '11',
    contractNumber: 'AQL-2023-011',
    customerName: 'Burgula OES',
    location: 'Warren, MI',
    startDate: '2023-06-15',
    status: 'in-progress' as const,
    defects: 8,
    inspector: 'Luis Garcia',
    shift: 'Morning',
    partName: 'Side Mirror Housing Assembly',
    pphv: 20.1,
    billingStatus: 'pending' as const,
    totalReviewed: 410,
    emergencyProcedures: 'Report to designated assembly points.',
    emergencyFloorPlan: 'Posted at all exits.'
  },
  {
    id: '12',
    contractNumber: 'AQL-2023-012',
    customerName: 'Precision Auto Parts',
    location: 'Detroit, MI',
    startDate: '2023-07-01',
    status: 'completed' as const,
    defects: 3,
    inspector: 'Luis Garcia',
    shift: 'Afternoon',
    partName: 'Brake Pedal Assembly',
    pphv: 24.5,
    billingStatus: 'paid' as const,
    totalReviewed: 680,
    emergencyProcedures: 'Use emergency exits marked with green signs.',
    emergencyFloorPlan: 'Available in the quality control office.'
  },
  {
    id: '13',
    contractNumber: 'AQL-2023-013',
    customerName: 'Global Motors',
    location: 'Detroit, MI',
    startDate: '2023-07-15',
    status: 'needs-review' as const,
    defects: 16,
    inspector: 'Luis Garcia',
    shift: 'Night',
    partName: 'HVAC Control Panel',
    pphv: 15.8,
    billingStatus: 'billed' as const,
    totalReviewed: 520,
    emergencyProcedures: 'Follow the yellow safety path to exits.',
    emergencyFloorPlan: 'Posted on all bulletin boards.'
  },
  {
    id: '14',
    contractNumber: 'AQL-2023-014',
    customerName: 'TechDrive Solutions',
    location: 'Warren, MI',
    startDate: '2023-08-01',
    status: 'in-progress' as const,
    defects: 11,
    inspector: 'Luis Garcia',
    shift: 'Morning',
    partName: 'Dashboard Light Assembly',
    pphv: 18.7,
    billingStatus: 'pending' as const,
    totalReviewed: 490,
    emergencyProcedures: 'Proceed to nearest exit if alarm sounds.',
    emergencyFloorPlan: 'Distributed during safety orientation.'
  },
  {
    id: '15',
    contractNumber: 'AQL-2023-015',
    customerName: 'Automotive Excellence Inc.',
    location: 'Detroit, MI',
    startDate: '2023-08-15',
    status: 'pending' as const,
    defects: 0,
    inspector: 'Luis Garcia',
    shift: 'Afternoon',
    partName: 'Window Control Switch Panel',
    pphv: null,
    billingStatus: 'pending' as const,
    totalReviewed: 0,
    emergencyProcedures: 'Wait for instructions from safety coordinator.',
    emergencyFloorPlan: 'Located at main entrance.'
  }
];

export const mockDefects = [
  {
    id: '1',
    jobId: '1',
    defectTypeId: 'surface-scratch',
    defectTypeName: 'Surface Scratch',
    count: 3,
    date: '2024-06-15',
    shift: 'Morning',
    reportedBy: 'John Smith',
    status: 'pending' as const,
    notes: 'Minor surface scratches on panel'
  }
];

export const mockDefectTypes = [
  {
    id: 'surface-scratch',
    name: 'Surface Scratch',
    description: 'Superficial scratches on the surface',
    category: 'Cosmetic',
    severity: 'low' as const
  }
];

export const mockDefectSummaries = [
  {
    defectTypeId: 'surface-scratch',
    defectTypeName: 'Surface Scratch',
    totalCount: 12,
    byMonth: {
      'june24': 3,
      'july24': 4,
      'august24': 3,
      'september24': 2
    },
    byDay: {
      '2024-06-15': 3,
      '2024-07-20': 4
    }
  }
];

export const mockMonthlyData = {
  'june24': { defects: 3, reviewed: 450, pphv: 18.5 },
  'july24': { defects: 4, reviewed: 500, pphv: 19.2 },
  'august24': { defects: 3, reviewed: 480, pphv: 17.9 },
  'september24': { defects: 2, reviewed: 420, pphv: 16.7 }
};

export const mockDailyReviewData = [
  {
    date: '2024-06-15',
    totalReviewed: 450,
    totalDefects: 12,
    pphv: 18.5
  },
  {
    date: '2024-07-20',
    totalReviewed: 500,
    totalDefects: 15,
    pphv: 19.2
  }
];
