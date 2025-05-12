import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';
import { createJob } from '@/services/aqlService';
import { supabase } from '@/lib/supabase';
import { Job, JobFormData } from '@/types/aql';

const SimpleJobForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([]);
  const [inspectors, setInspectors] = useState<Array<{ id: string; name: string }>>([]);
  const [formData, setFormData] = useState<JobFormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    jobDetails: ''
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load locations
        const { data: locationsData } = await supabase
          .from('locations')
          .select('id, name')
          .order('name');

        if (locationsData) {
          setLocations(locationsData);
        }

        // Load inspectors
        const { data: inspectorsData } = await supabase
          .from('profiles')
          .select('id, name')
          .eq('role', 'inspector')
          .order('name');

        if (inspectorsData) {
          setInspectors(inspectorsData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load form data');
      }
    };

    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.customerName) {
        toast.error('Please enter a customer name');
        setLoading(false);
        return;
      }

      // Create job data
      const jobData: Omit<Job, 'createdAt' | 'updatedAt'> = {
        title: `Job for ${formData.customerName}`,
        status: 'draft',
        location_id: locations[0]?.id || '', // Use first location as default
        inspector_id: inspectors[0]?.id || '', // Use first inspector as default
        form_data: formData,
        customer: {
          name: formData.customerName,
          email: formData.customerEmail,
          phone: formData.customerPhone,
          address: formData.customerAddress
        },
        location: {
          id: locations[0]?.id || '',
          name: locations[0]?.name || ''
        }
      };

      // Create job
      const newJob = await createJob(jobData);
      toast.success('Job created successfully');
      navigate('/aql');
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Job</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Enter customer name"
                required
              />
            </div>

            <div>
              <Label htmlFor="customerEmail">Customer Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                placeholder="Enter customer email"
              />
            </div>

            <div>
              <Label htmlFor="customerPhone">Customer Phone</Label>
              <Input
                id="customerPhone"
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                placeholder="Enter customer phone"
              />
            </div>

            <div>
              <Label htmlFor="customerAddress">Customer Address</Label>
              <Textarea
                id="customerAddress"
                value={formData.customerAddress}
                onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                placeholder="Enter customer address"
              />
            </div>

            <div>
              <Label htmlFor="jobDetails">Job Details</Label>
              <Textarea
                id="jobDetails"
                value={formData.jobDetails}
                onChange={(e) => setFormData({ ...formData, jobDetails: e.target.value })}
                placeholder="Enter job details"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/aql')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Job'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SimpleJobForm; 