import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { CertificationQuestion } from '@/services/aqlService';

interface CertificationFlowProps {
  jobTitle: string;
  safetyRequirements: string[];
  instructions: string;
  defectGuidelines: string;
  certificationQuestions: CertificationQuestion[];
  onComplete: () => void;
  onCancel: () => void;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

const CertificationFlow: React.FC<CertificationFlowProps> = ({
  jobTitle,
  safetyRequirements,
  instructions,
  defectGuidelines,
  certificationQuestions = [],
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [acceptedSafety, setAcceptedSafety] = useState(false);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [acceptedGuidelines, setAcceptedGuidelines] = useState(false);
  const [acceptedResponsibilities, setAcceptedResponsibilities] = useState(false);
  const [forcedRender, setForcedRender] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  // Fallback quiz questions if none are provided
  const fallbackQuizQuestions: QuizQuestion[] = [
    {
      question: "What should you do if you identify a critical defect?",
      options: [
        "Continue with inspection and note it at the end",
        "Report it immediately to your supervisor",
        "Attempt to fix it yourself",
        "Ignore it if it doesn't affect function"
      ],
      correctAnswer: 1
    },
    {
      question: "When should you wear safety glasses during inspection?",
      options: [
        "Only when working with chemicals",
        "When your supervisor is watching",
        "At all times during inspection",
        "Only when operating machinery"
      ],
      correctAnswer: 2
    },
    {
      question: "How should you document defects?",
      options: [
        "Verbally tell your team lead",
        "Remember them and log them at the end of the day",
        "Take detailed notes but no photos",
        "Document in the system with photos when required"
      ],
      correctAnswer: 3
    }
  ];

  // Use dynamic questions if available, otherwise use fallback
  const quizQuestions = certificationQuestions.length > 0 
    ? certificationQuestions.map(q => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswerIndex
      })) 
    : fallbackQuizQuestions;

  // Initialize selected answers array when questions change
  useEffect(() => {
    setSelectedQuizAnswers(new Array(quizQuestions.length).fill(-1));
    setQuizSubmitted(false);
  }, [quizQuestions]);

  const totalSteps = 4; // Safety, Quiz, Guidelines, Responsibilities
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Last step, complete certification
      onComplete();
      toast.success("Certification completed successfully!");
    }
  };

  const handleBack = () => {
    if (currentStep === 0) {
      onCancel();
    } else {
      setCurrentStep(prev => prev - 1);
    }
  };

  const submitQuizAnswers = (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!formRef.current) return;
    
    // Get all selected radio buttons
    const selectedRadios = Array.from(formRef.current.querySelectorAll('input[type="radio"]:checked'));
    
    // If not all questions are answered
    if (selectedRadios.length < quizQuestions.length) {
      toast.error("Please answer all questions before submitting");
      return;
    }
    
    // Check answers
    let allCorrect = true;
    let incorrectAnswers: number[] = [];
    
    const newAnswers = new Array(quizQuestions.length).fill(-1);
    
    selectedRadios.forEach((radio) => {
      const input = radio as HTMLInputElement;
      const [questionIndex, optionIndex] = input.name.split('-')[1].split('_').map(Number);
      newAnswers[questionIndex] = optionIndex;
      
      if (optionIndex !== quizQuestions[questionIndex].correctAnswer) {
        allCorrect = false;
        incorrectAnswers.push(questionIndex + 1);
      }
    });
    
    // Update state
    setSelectedQuizAnswers(newAnswers);
    
    if (allCorrect) {
      setQuizSubmitted(true);
      toast.success("All answers are correct! You can proceed to the next step.");
    } else {
      const incorrectList = incorrectAnswers.join(", ");
      toast.error(`Incorrect answers for question${incorrectAnswers.length > 1 ? 's' : ''} ${incorrectList}. Please try again.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-center">Certification Required</h2>
        <p className="text-center text-muted-foreground">
          Complete the required certification for "{jobTitle}" before starting the inspection
        </p>
      </div>

      <Progress value={progress} className="h-2" />

      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === 0 && "Safety Requirements"}
            {currentStep === 1 && "Work Instructions"}
            {currentStep === 2 && "Defect Guidelines"}
            {currentStep === 3 && "Job Responsibilities"}
          </CardTitle>
          <CardDescription>
            Step {currentStep + 1} of {totalSteps}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-800 text-sm">
                  You must confirm that you understand and will comply with all safety requirements for this job.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Required Safety Measures:</h3>
                <ul className="space-y-2">
                  {safetyRequirements.map((requirement, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <ShieldCheck className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="safety-confirmation"
                  checked={acceptedSafety}
                  onCheckedChange={(checked) => setAcceptedSafety(checked as boolean)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="safety-confirmation"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I confirm that I have read, understood, and will follow all safety requirements
                  </Label>
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
                <h3 className="font-medium mb-2">Work Instructions</h3>
                <p className="text-sm whitespace-pre-line">{instructions}</p>
              </div>

              <div className="space-y-4 mt-4">
                <h3 className="font-medium">Knowledge Check:</h3>
                
                <form ref={formRef} onSubmit={submitQuizAnswers} className="space-y-6">
                  {quizQuestions.map((question, qIndex) => (
                    <div key={qIndex} className="border rounded-lg p-4 mb-4 bg-white">
                      <p className="font-medium mb-3">
                        Question {qIndex + 1}: {question.question}
                      </p>
                      <div className="space-y-3">
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-start">
                            <input
                              type="radio"
                              id={`question-${qIndex}_${oIndex}`}
                              name={`question-${qIndex}_${oIndex}`}
                              className="mt-1 mr-3"
                              onChange={() => {
                                console.log(`Selected Q${qIndex+1}, option ${oIndex+1}`);
                                const newArr = [...selectedQuizAnswers];
                                newArr[qIndex] = oIndex;
                                setSelectedQuizAnswers(newArr);
                                if (quizSubmitted) setQuizSubmitted(false);
                                setForcedRender(prev => prev + 1); // Force re-render
                              }}
                            />
                            <label 
                              htmlFor={`question-${qIndex}_${oIndex}`}
                              className="text-sm cursor-pointer"
                            >
                              {option}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    type="submit"
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow"
                  >
                    Submit Answers
                  </button>
                </form>
                
                {quizSubmitted && (
                  <div className="p-4 mt-4 bg-green-50 text-green-800 rounded-md flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span>Quiz completed successfully! Click "Next" to continue.</span>
                  </div>
                )}
                
                {/* Debug indicator */}
                <div className="text-xs text-gray-400 mt-2">
                  Selected: {JSON.stringify(selectedQuizAnswers)} (Render: {forcedRender})
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
                <h3 className="font-medium mb-2">Defect Guidelines</h3>
                <p className="text-sm whitespace-pre-line">{defectGuidelines}</p>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="guidelines-confirmation"
                  checked={acceptedGuidelines}
                  onCheckedChange={(checked) => setAcceptedGuidelines(checked as boolean)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="guidelines-confirmation"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I confirm that I have read and understood the defect guidelines and will report defects according to these standards
                  </Label>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-md">
                <h3 className="font-medium mb-2">Job Responsibilities</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Conduct thorough inspections according to the work instructions</li>
                  <li>• Report all defects accurately using the defect reporting system</li>
                  <li>• Take clear photos of defects when required</li>
                  <li>• Document all inspection activities in the system</li>
                  <li>• Maintain accurate records of all inspected parts</li>
                  <li>• Alert supervisors of any critical defects immediately</li>
                  <li>• Complete assigned inspections within the allotted timeframe</li>
                </ul>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="responsibilities-confirmation"
                  checked={acceptedResponsibilities}
                  onCheckedChange={(checked) => setAcceptedResponsibilities(checked as boolean)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="responsibilities-confirmation"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I accept these job responsibilities and will fulfill them to the best of my ability
                  </Label>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleBack}>
            {currentStep === 0 ? "Cancel" : "Back"}
          </Button>
          <Button 
            onClick={handleNext}
            disabled={(currentStep === 0 && !acceptedSafety) || 
                    (currentStep === 1 && !quizSubmitted) || 
                    (currentStep === 2 && !acceptedGuidelines) || 
                    (currentStep === 3 && !acceptedResponsibilities)}
          >
            {currentStep < totalSteps - 1 ? "Next" : "Complete Certification"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CertificationFlow;
