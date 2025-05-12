-- Script to create mock jobs for inspector view with certification assessments
-- Run this in the Supabase SQL Editor

-- Identify the inspector user IDs (use a placeholder if none exist)
DO $$
DECLARE
    inspector_id UUID;
    demo_user_id UUID := '00000000-0000-0000-0000-000000000000'; -- Demo mode user ID
BEGIN
    -- Try to find a real inspector user
    SELECT id INTO inspector_id FROM auth.users LIMIT 1;
    
    -- If no users found, use demo ID
    IF inspector_id IS NULL THEN
        inspector_id := demo_user_id;
        RAISE NOTICE 'No users found, using demo user ID: %', demo_user_id;
    ELSE
        RAISE NOTICE 'Using inspector ID: %', inspector_id;
    END IF;
    
    -- Insert mock jobs with certification assessments
    
    -- Job 1: Automotive Door Panel Inspection
    INSERT INTO public.jobs (
        title,
        job_number,
        status,
        priority, 
        customer_name,
        customer_data,
        location_data,
        inspector_id,
        inspector,
        assignedTo,
        safety_requirements,
        defect_guidelines,
        instructions,
        certification_questions,
        estimated_hours,
        is_batch_job,
        created_at,
        updated_at,
        user_id
    ) VALUES (
        'Automotive Door Panel Inspection',
        'LOC-101-1',
        'assigned',
        'High',
        'Ford Motors',
        jsonb_build_object(
            'name', 'Ford Motors',
            'email', 'quality@ford.example.com',
            'phone', '(313) 555-1234',
            'company', 'Ford Motor Company'
        ),
        jsonb_build_object(
            'address', '1 American Road, Dearborn, MI 48126',
            'latitude', 42.3223,
            'longitude', -83.2272
        ),
        inspector_id,
        'John Smith',
        inspector_id,
        jsonb_build_array('Safety Glasses', 'Steel Toe Boots', 'Hearing Protection'),
        'Any dent larger than 1mm is considered a defect. Scratches longer than 3mm must be reported.',
        'Inspect door panels for proper fit, finish, and paint quality. Check for dents, scratches, and proper seal fitment.',
        jsonb_build_array(
            jsonb_build_object(
                'question', 'What is the minimum thickness requirement for automotive door panels?',
                'options', jsonb_build_array('0.5mm', '0.8mm', '1.2mm', '1.5mm'),
                'correctAnswerIndex', 2
            ),
            jsonb_build_object(
                'question', 'Which PPE is required when inspecting freshly painted panels?',
                'options', jsonb_build_array('Only gloves', 'Safety glasses only', 'Respirator and safety glasses', 'No PPE required'),
                'correctAnswerIndex', 2
            ),
            jsonb_build_object(
                'question', 'What tool is used to measure paint thickness?',
                'options', jsonb_build_array('Caliper', 'Paint depth gauge', 'Micrometer', 'Laser scanner'),
                'correctAnswerIndex', 1
            )
        ),
        4.5,
        true,
        NOW() - interval '2 days',
        NOW() - interval '2 days',
        inspector_id
    );
    
    -- Job 2: Engine Component Quality Check
    INSERT INTO public.jobs (
        title,
        job_number,
        status,
        priority, 
        customer_name,
        customer_data,
        location_data,
        inspector_id,
        inspector,
        assignedTo,
        safety_requirements,
        defect_guidelines,
        instructions,
        certification_questions,
        estimated_hours,
        is_batch_job,
        created_at,
        updated_at,
        user_id
    ) VALUES (
        'Engine Component Quality Check',
        'LOC-102-1',
        'assigned',
        'Medium',
        'General Motors',
        jsonb_build_object(
            'name', 'General Motors',
            'email', 'quality@gm.example.com',
            'phone', '(313) 667-1020',
            'company', 'General Motors Corporation'
        ),
        jsonb_build_object(
            'address', '300 Renaissance Center, Detroit, MI 48243',
            'latitude', 42.3293,
            'longitude', -83.0398
        ),
        inspector_id,
        'Maria Rodriguez',
        inspector_id,
        jsonb_build_array('Safety Glasses', 'Cut-resistant Gloves', 'Steel Toe Boots'),
        'All engine components must meet exact specification tolerances. Any deviation exceeding 0.02mm is a critical defect.',
        'Measure and inspect engine block components for dimensional accuracy. Check surface finish quality and thread integrity.',
        jsonb_build_array(
            jsonb_build_object(
                'question', 'What is the acceptable tolerance for engine cylinder dimensions?',
                'options', jsonb_build_array('±0.01mm', '±0.05mm', '±0.1mm', '±1mm'),
                'correctAnswerIndex', 0
            ),
            jsonb_build_object(
                'question', 'Which method is best for checking thread integrity?',
                'options', jsonb_build_array('Visual inspection only', 'Go/No-Go gauge', 'Caliper measurement', 'Weight comparison'),
                'correctAnswerIndex', 1
            ),
            jsonb_build_object(
                'question', 'What surface finish parameter is most important for engine blocks?',
                'options', jsonb_build_array('Gloss level', 'Ra value', 'Color consistency', 'Temperature resistance'),
                'correctAnswerIndex', 1
            ),
            jsonb_build_object(
                'question', 'When inspecting aluminum components, which contaminant is most critical to identify?',
                'options', jsonb_build_array('Dust', 'Oil residue', 'Iron particles', 'Plastic shavings'),
                'correctAnswerIndex', 2
            )
        ),
        6.0,
        false,
        NOW() - interval '1 day',
        NOW() - interval '1 day',
        inspector_id
    );
    
    -- Job 3: Headlight Assembly Inspection
    INSERT INTO public.jobs (
        title,
        job_number,
        status,
        priority, 
        customer_name,
        customer_data,
        location_data,
        inspector_id,
        inspector,
        assignedTo,
        safety_requirements,
        defect_guidelines,
        instructions,
        certification_questions,
        estimated_hours,
        is_batch_job,
        created_at,
        updated_at,
        user_id
    ) VALUES (
        'Headlight Assembly Inspection',
        'LOC-103-1',
        'assigned',
        'Medium',
        'Toyota USA',
        jsonb_build_object(
            'name', 'Toyota USA',
            'email', 'quality@toyota.example.com',
            'phone', '(859) 555-8989',
            'company', 'Toyota Motor Manufacturing'
        ),
        jsonb_build_object(
            'address', '25 Atlantic Avenue, Erlanger, KY 41018',
            'latitude', 39.0253,
            'longitude', -84.6051
        ),
        inspector_id,
        'Robert Johnson',
        inspector_id,
        jsonb_build_array('ESD Protection', 'Safety Glasses', 'Clean Gloves'),
        'Headlights must be free of moisture, cracks, and discoloration. LED functionality must be 100% operational.',
        'Test light output and pattern. Check seals for proper installation. Verify electrical connections and light functionality.',
        jsonb_build_array(
            jsonb_build_object(
                'question', 'What should you check first when inspecting a sealed headlight assembly?',
                'options', jsonb_build_array('Light output', 'Seal integrity', 'Lens clarity', 'Wire connections'),
                'correctAnswerIndex', 1
            ),
            jsonb_build_object(
                'question', 'What is the correct testing voltage for modern LED headlight assemblies?',
                'options', jsonb_build_array('5V', '12V', '24V', 'It varies by manufacturer'),
                'correctAnswerIndex', 3
            ),
            jsonb_build_object(
                'question', 'What environmental test should be performed on headlight assemblies?',
                'options', jsonb_build_array('Heat cycle test', 'Impact test', 'Water submersion test', 'All of the above'),
                'correctAnswerIndex', 3
            )
        ),
        3.5,
        true,
        NOW(),
        NOW(),
        inspector_id
    );

    RAISE NOTICE 'Successfully created 3 mock jobs with certification assessments';
END $$;

-- Confirm jobs were created
SELECT id, title, job_number, status, inspector, estimated_hours, created_at 
FROM public.jobs 
ORDER BY created_at DESC 
LIMIT 5;

-- Success message
SELECT '3 mock jobs with certification assessments have been created for inspector view.' AS message; 