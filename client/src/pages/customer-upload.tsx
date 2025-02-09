import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOrderSchema, uploadOrderSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { UploadIcon } from "lucide-react";

type Step = "order" | "upload";

export default function CustomerUpload() {
  const [step, setStep] = useState<Step>("order");
  const [orderId, setOrderId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const orderForm = useForm({
    resolver: zodResolver(insertOrderSchema),
    defaultValues: { id: "" }
  });

  const uploadForm = useForm({
    resolver: zodResolver(uploadOrderSchema),
    defaultValues: {
      videos: [],
      images: [],
      songRequest: ""
    }
  });

  const onOrderSubmit = async (data: { id: string }) => {
    try {
      await apiRequest("POST", "/api/orders", data);
      setOrderId(data.id);
      setStep("upload");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const onUploadSubmit = async (data: any) => {
    try {
      await apiRequest("POST", `/api/orders/${orderId}/upload`, data);
      navigate("/success");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: "videos" | "images") => {
    const files = Array.from(e.target.files || []);
    const maxSize = 3 * 1024 * 1024; // 3MB

    setIsUploading(true);
    try {
      const uploadPromises = files.map(async file => {
        if (file.size > maxSize) {
          throw new Error(`File ${file.name} exceeds 3MB limit`);
        }

        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const { url } = await res.json();
        return {
          name: file.name,
          url
        };
      });

      const fileData = await Promise.all(uploadPromises);
      uploadForm.setValue(type, fileData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            {step === "order" ? "Enter Your Order ID" : "Upload Files"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === "order" ? (
            <Form {...orderForm}>
              <form onSubmit={orderForm.handleSubmit(onOrderSubmit)} className="space-y-4">
                <FormField
                  control={orderForm.control}
                  name="id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your order ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Continue
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...uploadForm}>
              <form onSubmit={uploadForm.handleSubmit(onUploadSubmit)} className="space-y-4">
                <FormField
                  control={uploadForm.control}
                  name="videos"
                  render={() => (
                    <FormItem>
                      <FormLabel>Videos (Max 3MB)</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="video/*"
                          onChange={e => handleFileChange(e, "videos")}
                          multiple
                          disabled={isUploading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={uploadForm.control}
                  name="images"
                  render={() => (
                    <FormItem>
                      <FormLabel>Images</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={e => handleFileChange(e, "images")}
                          multiple
                          disabled={isUploading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={uploadForm.control}
                  name="songRequest"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Song Request</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your song request" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isUploading}>
                  <UploadIcon className="mr-2 h-4 w-4" />
                  {isUploading ? "Uploading..." : "Upload Files"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}