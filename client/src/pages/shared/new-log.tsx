import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";

const formSchema = z.object({
  plotId: z.string().min(1, "Plot selection is required"),
  activityType: z.string().min(1, "Activity type is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  activityDate: z.string().min(1, "Activity date is required"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  stakeholdersPresent: z.string().optional(),
  governmentOfficials: z.string().optional(),
  currentStatus: z.string().min(1, "Status is required"),
  priority: z.string().min(1, "Priority is required"),
  issuesEncountered: z.string().optional(),
  nextSteps: z.string().optional(),
  targetCompletionDate: z.string().optional(),
});

interface NewLogProps {
  userType?: 'citizen' | 'officer' | 'admin';
}

export default function NewLog({ userType = 'officer' }: NewLogProps) {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      plotId: "",
      activityType: "",
      description: "",
      activityDate: new Date().toISOString().split('T')[0],
      startTime: "",
      endTime: "",
      stakeholdersPresent: "",
      governmentOfficials: "",
      currentStatus: "",
      priority: "medium",
      issuesEncountered: "",
      nextSteps: "",
      targetCompletionDate: "",
    },
  });

  const { data: plots, isLoading: plotsLoading } = useQuery({
    queryKey: ["/api/plots"],
    enabled: isAuthenticated,
  });

  const createLogMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const payload = {
        ...data,
        plotId: parseInt(data.plotId),
        activityDate: new Date(data.activityDate).toISOString(),
        startTime: data.startTime ? new Date(`${data.activityDate}T${data.startTime}`).toISOString() : null,
        endTime: data.endTime ? new Date(`${data.activityDate}T${data.endTime}`).toISOString() : null,
        targetCompletionDate: data.targetCompletionDate ? new Date(data.targetCompletionDate).toISOString() : null,
      };
      
      await apiRequest("POST", "/api/demarcation-logs", payload);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Demarcation log created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/demarcation-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/plots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setLocation("/plots");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create demarcation log",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createLogMutation.mutate(data);
  };

  if (isLoading || plotsLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navbar />
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-neutral-200 rounded w-1/4 mb-4"></div>
              <div className="bg-white rounded-xl p-8">
                <div className="space-y-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-16 bg-neutral-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-800 mb-2">New Demarcation Log</h1>
            <p className="text-neutral-600">Record a new demarcation activity for your assigned plot</p>
          </div>

          <Card className="shadow-sm border border-neutral-100">
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Plot Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-800 mb-4">Plot Information</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="plotId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Plot ID</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select plot from your assignments" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {plots && plots.map((plot: any) => (
                                  <SelectItem key={plot.id} value={plot.id.toString()}>
                                    {plot.plotId} - {plot.ownerName || "Unknown"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="activityType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Activity Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select activity type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="initial_survey">Initial Survey</SelectItem>
                                <SelectItem value="boundary_marking">Boundary Marking</SelectItem>
                                <SelectItem value="dispute_resolution">Dispute Resolution</SelectItem>
                                <SelectItem value="final_verification">Final Verification</SelectItem>
                                <SelectItem value="documentation">Documentation</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Activity Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-800 mb-4">Activity Details</h3>
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Activity Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Provide detailed description of the demarcation activity..."
                                className="min-h-[120px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid md:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="activityDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date of Activity</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="startTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Time</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="endTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Time</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stakeholders */}
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-800 mb-4">Stakeholders Present</h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="stakeholdersPresent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Land Owners/Representatives</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Names and contact details of land owners present..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="governmentOfficials"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Government Officials</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Names and designations of other officials present..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Status and Issues */}
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-800 mb-4">Status & Issues</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="currentStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select current status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="completed">Completed Successfully</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="pending">Pending Further Action</SelectItem>
                                <SelectItem value="disputed">Disputed</SelectItem>
                                <SelectItem value="on_hold">On Hold</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority Level</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="mt-6">
                      <FormField
                        control={form.control}
                        name="issuesEncountered"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Issues Encountered</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe any issues, disputes, or complications encountered..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-800 mb-4">Next Steps</h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="nextSteps"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Required Actions</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Outline the next steps required to complete this demarcation..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="targetCompletionDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Completion Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-neutral-200">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setLocation("/plots")}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createLogMutation.isPending}
                      className="bg-primary hover:bg-blue-700"
                    >
                      {createLogMutation.isPending ? "Creating..." : "Submit Log Entry"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
